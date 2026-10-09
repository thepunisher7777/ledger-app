# Estado actualizado — 2026-10-10, Preview 2

Se sustituye el flujo público OTP por usuario/contraseña y código de recuperación guardado conscientemente. No depende de SMTP ni Brevo. Endpoint real `couple-identity` desplegado en el proyecto autorizado; registro, login, invitación entre dos usuarios, recuperación, rechazo de código inválido/consumido, contraseña antigua y JWT revocado validados por HTTP. Los apartados OTP siguientes describen la auditoría y decisiones anteriores, ahora reemplazadas por este flujo. No se migran identidades existentes ni datos personales.

`npm test` incluye las regresiones anteriores más las pruebas de identidad/recuperación y permisos server-only. Advisors no señalan funciones administrativas de identidad accesibles a anon/authenticated; los avisos de RPC financieras privilegiadas son intencionales y sus guards se prueban. Las tablas privadas sin políticas deniegan acceso por diseño. Protección de contraseñas filtradas no habilitada; pendiente CAPTCHA para lanzamiento amplio y Safari/iPhone físico. Producción intacta.

# Ledger Couple — auditoría y arquitectura

Fecha: 2026-10-09. Rama: `feature/couple-mode`. Estado: **vista previa; sin despliegue de producción**.

## Código original verificado

Repositorio: https://github.com/thepunisher7777/ledger-app

Base: `c0b267748b3e0a533b538a8abda5cbde2ce4de80` (main), Beta 1.5.0. La app es HTML/CSS/JavaScript nativo, con PWA/service worker, almacenamiento local, módulos de dinero EUR/USD, importador XML, traducciones y PostHog opt-in. No había backend compartido ni autenticación Supabase configurada.

Se creó un worktree independiente y un bundle verificable del historial antes de editar. `git bundle verify` pasó. SHA-256 del bundle: `13310e8e2ede0d883c79926f167cf261b5896c6c663fcbaf0ad4cfda92f0a677`. Esto protege el código; **no es una copia de datos financieros de usuarios**. No se accedió a datos reales ni se modificaron otros repositorios.

## Decisiones implementadas

- Se conserva la app nativa, sin reescribirla en un framework. `couple-core.js` contiene contabilidad y exportación; `couple-sync.js`, sincronización; `couple-ui.js` y `couple.css`, interfaz integrada.
- Personal mantiene `flowfi.public.v27`, esquema, importaciones, backups y acceso sin login. El módulo compartido no recibe el estado Personal ni lee su clave de almacenamiento.
- Pareja utiliza Supabase Auth + PostgreSQL/RLS + RPC atómicas + Postgres Changes. PostgreSQL proporciona integridad, bloqueos, versiones y autorización efectiva por fila. Solo se crean tablas compartidas; no hay ninguna tabla de finanzas personales en la migración.
- SDK oficial Supabase 2.117.3, fijado, servido localmente con su licencia. No hay CDN de código, service-role ni claves configuradas en el repositorio.
- Nuevos recursos PWA en un namespace de caché nuevo. El service worker no intercepta solicitudes Supabase de otro origen.
- No hay cron, suscripciones de pago, integración bancaria, automatizaciones de Work ni tareas fuera de la aplicación abierta.

## Funciones en esta rama

Selector Personal/Pareja, identidad OTP opcional para Personal, creación/aceptación explícita de invitaciones, gastos/ingresos, fondos comunes, aportaciones, repartos 50/50/porcentaje/importe/todo un miembro, compensaciones pagadas, presupuestos mensuales, objetivos, reglas recurrentes con registro manual, estadísticas por persona/categoría/moneda, filtro mensual, auditoría, copia personal saneada, backup/exportación compartida, restauración revisada del mismo espacio, cola offline, conflictos, cierre y revocación.

La moneda base del espacio se fija al crearlo. Cada operación guarda importe original, céntimos en base, tipo, fecha y fuente. No se recalculan saldos históricos usando cotizaciones futuras. El tipo compartido se confirma manualmente; la actualización automática de tipos Personal existente permanece intacta.

## Pruebas y límites de la verificación

`npm ci --ignore-scripts && npm test` ejecuta regresiones originales, multidivisa/XML, service worker, autorización PostgreSQL, dominio/sincronización/HTTP e interfaz nativa.

La suite de autorización ejecuta **la migración real en PostgreSQL PGlite**, con roles `anon`/`authenticated`, A/B ficticios y un tercero C. La suite de sincronización usa dos clientes independientes, almacenamiento distinto y HTTP local contra esa misma autorización SQL. Las identidades de ese servidor de pruebas están controladas por fixtures; **no prueba el gateway JWT de Supabase alojado**. Las pruebas DOM utilizan datos ficticios identificados como fixtures; la aplicación entregada no incluye anuncios/datos de prueba ni una conexión simulada.

Queda pendiente validar Auth/OTP, PostgREST y Realtime en un proyecto Supabase autorizado y dos dispositivos reales. No se pudo instalar Chromium/WebKit en este entorno: la descarga devolvió archivos incompletos. Por tanto no se declara validación visual en Safari ni en un iPhone físico. La PWA, formularios adaptativos y rutas se prueban estructuralmente, pero la aceptación móvil es un bloqueo de publicación.

Actualización 10/10/2026: creado y verificado `ledger-couple-test` en ARX Free, Frankfurt (`tsmdkrllkafmlqcwzsii`), sin pagos. Migración inicial aplicada. Las seis tablas tienen RLS; clientes anónimos no pueden leer entidades ni ejecutar RPC de creación y los autenticados no pueden escribir directamente en tablas. Publicación Realtime limitada a espacios, miembros y entidades compartidas. Se revocó acceso cliente al helper `rls_auto_enable` instalado por Supabase; la segunda migración registra este endurecimiento.

Tres identidades ficticias fueron creadas mediante Auth Admin en una función temporal protegida por JWT y un secreto aleatorio con caducidad de diez minutos. La función fue sustituida inmediatamente por una respuesta 410 sin operaciones. Ninguna clave administrativa fue copiada al cliente o al repositorio. La primera ejecución no recibió el evento Realtime esperado; la segunda sí lo recibió y superó ocho comprobaciones alojadas: tercero, campos privados, Realtime, lectura por B/aislamiento de C, escritura directa, idempotencia, conflicto de revisión e invitación consumida. Se verificó después mediante HTTP real que un JWT firmado anterior al logout no permite lectura ni RPC. La ejecución completa se interrumpió tras respuestas muy lentas; el runner incorpora ahora límites de 30 segundos por petición. No se declara aún aceptación completa y reproducible de la suite alojada.

El panel Auth muestra que las plantillas por defecto están en uso y exige SMTP propio para editarlas. El acceso público por código OTP requiere configurar un proveedor de correo y sus plantillas; no se habilita un registro sin verificación ni se contrata un servicio de pago. Sigue pendiente prueba en Safari/iPhone físico y publicación de la rama.

Bloqueo concreto del conector: `get_cost` devuelve `MCP tool get_cost was not returned by tools/list`. No se puede obtener la confirmación de coste que exige `create_project`; no se inventa un identificador de confirmación ni se crea infraestructura ignorando ese requisito. Alternativa: creación de proyecto Free desde el panel de Supabase, con organización y región confirmadas, y después aplicar/verificar la migración mediante el conector. Nueva ejecución local completa: 39 pruebas SQL de autorización, 20 de dominio/sincronización/HTTP, 10 DOM y regresiones originales aprobadas.

## Riesgos detectados y tratados

Verificación final 09/10/2026 UTC: invitaciones por enlace privado incorporadas, sin unión automática ni envío a analíticas. Tras investigar las esperas se corrigió el uso de SQLSTATE `40001` en conflictos de negocio mediante una migración adicional con `PT409`: PostgREST podía reintentar indefinidamente una serialización ficticia. Las pruebas locales aplican ahora todas las migraciones ordenadas, no solo la inicial.

La suite alojada completa pasó 12 comprobaciones con tres nuevas identidades ficticias: tercero/IDOR, campos privados, Realtime A→B, lecturas B y aislamiento C, escritura directa prohibida, idempotencia, conflicto real HTTP 409, invitación consumida, JWT revocado tras logout, revocación al abandonar, archivo cerrado de solo lectura y RPC sin sesión. Se ejecutó desde Edge Runtime para evitar el transporte WebSocket limitado del entorno local. La función temporal tenía JWT obligatorio, secreto aleatorio y límite de diez minutos; se sustituyó por HTTP 410 inmediatamente al terminar. Ninguna clave administrativa salió del runtime. Se conservaron archivos de auditoría ficticios; no se borraron datos reales. `npm test` pasó después de la corrección.

Advisors finales: las cinco RPC SECURITY DEFINER autenticadas son intencionales y validan sesión viva/membresía; las tablas de invitaciones/operaciones sin políticas son privadas por defecto. Revisar [RPC privilegiadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) y [tablas sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). La protección de contraseñas filtradas permanece deshabilitada en el proyecto Free; la interfaz pública utiliza OTP y las contraseñas solo se usaron en fixtures. No se afirma seguridad de un acceso público por contraseña. Véase [seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Separación explícita de módulos y almacenamiento; tokens de invitación de 256 bits, hash y caducidad; llamadas RPC con permisos mínimos; rechazo de campos privados; CAS para conflictos; sesión persistente solo por elección; caché por proyecto/usuario/espacio, borrada al cerrar sesión o revocar; bloqueo offline tras 15 minutos sin verificar permisos; exportación y restauración separadas.

La seguridad local comparte la limitación del Ledger original: una persona con acceso al navegador/dispositivo o una vulnerabilidad XSS puede leer almacenamiento local. RLS protege el servidor, no cifra el dispositivo ni puede retirar archivos ya exportados. Se requiere dispositivo privado, HTTPS y validación de despliegue antes de habilitar datos reales.

## Pendientes explícitos

1. Alta/login/recuperación sin correo implementados y validados en el backend de pruebas. Las 12 comprobaciones anteriores Auth/HTTP/Realtime y la nueva aceptación sin correo pasaron.
2. Superar aceptación visual en Safari/iPhone físico antes de fusionar/publicar sobre producción.
3. Restauración entre espacios distintos, cambio de miembros y cambio de moneda base no permitidos en esta versión.
4. Recurrentes se registran conscientemente; no se ejecutan solos en servidor.
5. No se incorporan sincronización Personal, bancos, push ni adjuntos.
6. Las copias personales se deduplican en el mismo dispositivo mediante comprobantes locales que nunca viajan al servidor. Entre dispositivos no pueden deduplicarse globalmente sin compartir la identidad original. La revisión consciente evita exportaciones automáticas; UUID e idempotencia evitan duplicados por reintento.
7. Eliminaciones son tombstones: no hay purga permanente ni recuperación silenciosa. El procedimiento de conservación está en `COUPLE_SECURITY.md`.
