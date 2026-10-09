# Configuración y validación de Pareja

Esta rama es una vista previa. Personal funciona sin backend/login. **No está desplegada sobre la publicación actual.**

## Desarrollo local

```sh
npm ci --ignore-scripts
python scripts/smoke_check.py
npm test
python -m http.server 8080 --bind 127.0.0.1
```

Abrir http://127.0.0.1:8080. En Personal comprobar datos ficticios, exportar y restaurar. En Pareja, sin configuración se indica el bloqueo; no se muestran balances ficticios como datos reales.

## Backend autorizado

1. Conectar la integración Supabase o proporcionar acceso administrativo a un **proyecto de pruebas autorizado**. No hay proyecto, claves ni credenciales preconfigurados. No crear un plan de pago.
2. Crear/usar proyecto Free, preferentemente región UE. Verificar que esté vacío o que esta migración no colisione con tablas existentes. Revisar la migración, no ejecutar sobre una base ajena sin autorización.
3. Aplicar `supabase/migrations/202610090001_couple.sql` desde el SQL Editor o pipeline autorizado. La migración es transaccional, inicial y de una sola aplicación. No borra tablas previas ni contiene finanzas personales.
4. Mantener Data API únicamente sobre los esquemas previstos; `ledger_private` NO debe exponerse. Comprobar grants/RLS y que `supabase_realtime` publique spaces/members/entities. La migración añade esas tablas si la publicación existe; no reemplaza otras publicaciones.
5. Activar Email Auth con verificación. En plantillas Magic Link y Confirm Signup, incluir `{{ .Token }}` para código OTP; Ledger no procesa magic links en URL. Mantener expiración/rate limits de Auth conservadores.
6. Para correo general configurar SMTP autorizado o un proveedor ya disponible; no contratarlo desde esta rama. El servicio de correo integrado de Supabase solo envía a direcciones preautorizadas del equipo y tiene límites reducidos: no basta para una pareja externa en producción.
7. Copiar solo URL HTTPS del proyecto y clave pública publishable/anon. En Ledger: PAREJA → Configurar conexión. Nunca service-role ni contraseña de base de datos. La configuración queda local en cada dispositivo; repetir en el segundo. Mantener sesión es opcional y solo para dispositivos privados.
8. A entra por correo, crea espacio, elige alias y EUR/USD. Genera un enlace privado que caduca en 24 h y pulsa Copiar enlace o Compartir. B abre el enlace en Ledger, entra con otra identidad y pulsa Aceptar invitación; el código se rellena sin realizar una vinculación automática. El código manual sigue disponible. Generar otra invitación revoca la anterior. El enlace por sí solo no sustituye la identificación segura.
9. Registrar datos exclusivamente ficticios. No importar backups reales para las pruebas.

## Aceptación alojada antes de publicar

- A y B tienen Personal distintos; C es un tercero sin vincular. A/B comparten solo su espacio, C no lee ni modifica aunque cambie UUID/cuerpo HTTP.
- Petición anónima no lee datos y no llama RPC; escritura directa a tablas denegada.
- A registra alquiler 1100 EUR 50/50: B debe 550. B liquida y desaparece la compensación sin duplicar gastos.
- Crear fondo, aportaciones, gastos del fondo, presupuestos y objetivos; comprobar EUR/USD y tipos históricos.
- Dos navegadores/dispositivos reciben cambios mediante Realtime; probar cola offline, respuesta perdida, edición y eliminación simultáneas, reconexión y conflicto visible.
- Copiar Personal exige revisión y confirmación; notas, cuentas, IDs originales y otros datos no aparecen en Network ni en exportación Pareja.
- Invitar de nuevo revoca token anterior; un código consumido/caducado falla; un tercer miembro no puede entrar.
- Logout limpia caché Pareja y preserva Personal. Abandonar revoca consultas/RPC del saliente incluso repitiendo una operación anterior; el restante tiene archivo cerrado de solo lectura.
- Exportar ambos espacios y restaurar por separado. Reimportar Pareja no duplica; un backup de otro espacio se rechaza; un conflicto no sobrescribe el servidor.
- iPhone Safari y PWA instalada: selector/rutas, teclado, formularios, modal, safe area, login OTP, offline y cierre de sesión. Revisar también escritorio.

Guardar la evidencia en un informe de pruebas, sin tokens, emails reales, contraseñas ni balances reales en GitHub. Fusionar/publicar únicamente tras superar esa puerta. El CI no publica la app ni aplica SQL.

Hay un runner adicional `npm run test:couple:hosted` para un proyecto aislado y tres identidades ficticias precreadas. Requiere variables locales `COUPLE_E2E_URL`, `COUPLE_E2E_PUBLIC_KEY`, `COUPLE_E2E_A_EMAIL`, `COUPLE_E2E_A_PASSWORD` (también B/C) y `COUPLE_E2E_ALLOW_MUTATIONS=fictional-only`. No guardar sus valores en GitHub. El runner usa Auth/HTTP/Realtime reales, crea y cierra un espacio ficticio y conserva su auditoría; no hace borrado permanente. Si una identidad ya tiene un espacio accesible, aborta. Las 12 comprobaciones pasaron desde una función temporal protegida, ahora deshabilitada, en el proyecto de pruebas autorizado. No se ejecuta automáticamente en CI. Prueba OTP por separado en los dispositivos: el runner inicia sesión con contraseñas de pruebas.

## Costes consultados el 2026-10-09

- Código y hosting estático existente: no se añade infraestructura de servidor de la app; no se cambió el hosting actual.
- Supabase Free: 0 USD/mes dentro de los límites del proveedor (500 MB de base, 50.000 MAU, 5 GB de egress; máximo dos proyectos activos y pausa tras una semana sin actividad). Adecuado para probar dos personas; no implica SLA ni backups de producción recuperables gestionados automáticamente.
- Correo SMTP: depende del proveedor que se autorice; puede usar un plan gratuito si sus condiciones encajan. Actualmente **no configurado**.
- Pro parte desde 25 USD/mes; no está contratado ni es requisito de esta implementación. Revisar límites y condiciones antes de elegirlo.
- No IA de pago, cron externo, acceso bancario ni tareas automáticas de Work.

Fuentes primarias:

- https://supabase.com/pricing
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/reference/javascript/auth-signinwithotp
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/realtime/postgres-changes

## Reversión

La publicación original sigue en main. La rama puede descartarse sin tocar `flowfi.public.v27`. Si se habilita un backend de pruebas, primero exportar sus datos compartidos y retirar su uso en cliente; no ejecutar DROP ni borrar historiales sin autorización explícita. El bundle previo y el historial Git permiten recuperar el código original. No confundir backup de código con datos locales de cada usuario.
