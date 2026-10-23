# Ledger: revisión de seguridad y estabilidad — 23 octubre 2026

Alcance: código del repositorio y metadatos de permisos del proyecto Supabase que usa Pareja. Consultas de producción exclusivamente de lectura sobre catálogos PostgreSQL y advisors. No se han consultado movimientos, importes, notas, nombres de usuarios reales, hashes de recuperación, tokens o secretos; no se han aplicado migraciones ni cambiado configuración Auth.

## Hallazgo corregido: respuesta tardía después de cerrar sesión

Una restauración `getSession()` iniciada antes de cerrar sesión podía terminar después, volver a asignar el usuario antiguo y reconstruir el espacio y su caché. También faltaba invalidar las respuestas de lectura/escritura que ya estaban en vuelo. Se reprodujo con una promesa diferida en el módulo real `couple-sync.js`: antes de la corrección, el usuario reaparecía tras `logout()` y fallaba la aserción `user === null`.

La corrección introduce una generación local de sesión (`authEpoch`). `clear()` invalida operaciones anteriores; cada respuesta de Auth, descubrimiento, lectura y RPC comprueba la generación antes de mutar estado. Durante el cierre remoto se bloquea la restauración. Una respuesta obsoleta falla con `SESSION_CHANGED` y no se guarda como propuesta financiera ni se vuelve a persistir en caché. Esto no cancela una operación que el servidor ya hubiera confirmado antes del cierre: impide reutilizar su respuesta bajo una sesión posterior.

No cambia el formato de backups, las claves financieras de Personal, la vigencia del JWT, la renovación del SDK ni las reglas RLS. Los cierres explícitos continúan borrando la caché compartida. La reapertura de una sesión válida sigue funcionando.

## Permisos comprobados en el servidor

Consultas a `pg_class`, `pg_policies`, `pg_proc` y funciones `has_*_privilege`, sin leer filas de negocio:

| Superficie | Estado observado |
| --- | --- |
| 5 tablas `public.ledger_couple_*` | RLS activado |
| Espacios, miembros, entidades, actividad | `authenticated` tiene SELECT; cada política usa `ledger_private.member(...)`; sin INSERT/UPDATE/DELETE directos |
| Invitaciones | Sin SELECT para `anon` o `authenticated`; sin escrituras directas |
| `ledger_private.identities`, `identity_limits`, `operations` | RLS activado; sin lectura/escritura para clientes |
| 5 RPC de negocio Pareja | Ejecutables por `authenticated`, no por `anon`; `SECURITY DEFINER` con `search_path=''` |
| 4 RPC administrativas de identidad/recuperación | No ejecutables por `anon` ni `authenticated` |
| `ledger_private.member` | Comprueba usuario, membresía y sesión viva; permitido únicamente a `authenticated` |
| `ledger_private.session_valid` | Comprueba dueño de `auth.sessions`, `session_id`, vencimiento e identidad no anónima; no invocable directamente por clientes |
| Otras tablas de aplicación en `public` | No se observaron; el modelo actual no contiene una tabla de finanzas Personales |

La lectura del código SQL confirma comprobación de sesión y usuario al crear/unirse, comprobación de membresía al invitar/aplicar/abandonar y controles de revisión, idempotencia y campos permitidos en las operaciones. La prueba local PostgreSQL comprueba además IDOR, tercero ajeno, JWT anterior al logout, sesión expirada, código de invitación caducado, límite de dos miembros y rechazo de mutaciones directas.

## Advisors: interpretación y pendientes

- **INFO RLS sin políticas (4 tablas):** denegación deliberada para identidades, límites, operaciones e invitaciones. No se han añadido políticas abiertas para silenciar el aviso. [Explicación del linter](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- **WARN RPC `SECURITY DEFINER` ejecutable (5 funciones):** es intencionado para estas operaciones validadas; no basta el rol `authenticated`. Se verificaron los guardas de sesión/membresía y `search_path` vacío. No se han modificado privilegios para ocultar el aviso. [Linter](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- **WARN contraseñas filtradas:** protección HaveIBeenPwned desactivada. No se ha activado ningún plan de pago ni cambiado Auth; queda revisar disponibilidad/coste del plan y habilitarla cuando corresponda. El endpoint propio exige 12–128 caracteres y tiene límites persistentes, lo cual no equivale a detectar una contraseña comprometida. [Seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- **INFO rendimiento:** ocho índices aún sin uso registrado. Con la base pequeña no demuestran un problema y varios cubren claves foráneas o rutas de crecimiento; no se han eliminado. [Linter](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Offline, conflictos y PWA

- Caché compartida por proyecto, usuario y espacio. Propuestas UUID/idempotencia, revisiones CAS y conflictos separados.
- Lectura/escritura/exportación offline limitadas a 15 minutos desde la última verificación de acceso. La caché es almacenamiento del dispositivo, no una autorización del servidor ni una bóveda cifrada. La revocación en otro dispositivo necesita conexión para conocerse; al volver a conectar manda RLS.
- El service worker observado excluye Supabase por ser otro origen. La integración final la limita a una lista de recursos públicos y conserva una caché distinta para inicio, landing, demo y calculadora. No se ha añadido una API privada en el mismo origen.
- Safari/PWA y sus políticas de purga de almacenamiento requieren una validación en iPhone físico. No se ha utilizado un dispositivo real ni se afirma haber probado sesión/offline en iOS.
- El changelog actual de Supabase anuncia retirada de ciertos cifrados TLS 1.2 el **10 noviembre 2026**; clientes modernos de Safari/SDK no requieren una modificación por ese anuncio, pero navegadores antiguos deben validarse si se soportan. [Aviso oficial](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).

## Pruebas ejecutadas para este cambio

| Comando | Resultado |
| --- | --- |
| `node scripts/couple-session-race.test.cjs` antes del cambio | Fallo reproducible: el usuario volvía a aparecer tras logout |
| Mismo comando después | 4 escenarios aprobados: sesión tardía, refresh tardío, acuse RPC tardío, bloqueo durante sign-out pendiente |
| `node scripts/couple-session.test.cjs` | 4 escenarios SDK real/DOM aprobados; transporte Auth ficticio |
| `node scripts/couple-integration.test.mjs` | 20 pruebas dominio, sincronización y HTTP local aprobadas |
| `node scripts/couple-db.test.mjs` | 39 pruebas de autorización PostgreSQL aprobadas |
| `node scripts/couple-auth-db.test.mjs` | Recuperación/limitación protegidas, códigos erróneos/reutilizados rechazados y revocación de sesiones aprobadas |

Estas pruebas usan fixtures ficticias y PostgreSQL local/PGlite; no prueban todas las configuraciones de Auth alojado o una sesión real del propietario. El agente principal ejecutará la suite integrada del PR y decidirá su estado de despliegue. Este documento no afirma que el cambio ya esté publicado.

Referencias de configuración: [Supabase securing your data](https://supabase.com/docs/guides/database/secure-data), [product security](https://supabase.com/docs/guides/security/product-security), [user sessions](https://supabase.com/docs/guides/auth/sessions).
