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

## Riesgos detectados y tratados

Separación explícita de módulos y almacenamiento; tokens de invitación de 256 bits, hash y caducidad; llamadas RPC con permisos mínimos; rechazo de campos privados; CAS para conflictos; sesión persistente solo por elección; caché por proyecto/usuario/espacio, borrada al cerrar sesión o revocar; bloqueo offline tras 15 minutos sin verificar permisos; exportación y restauración separadas.

La seguridad local comparte la limitación del Ledger original: una persona con acceso al navegador/dispositivo o una vulnerabilidad XSS puede leer almacenamiento local. RLS protege el servidor, no cifra el dispositivo ni puede retirar archivos ya exportados. Se requiere dispositivo privado, HTTPS y validación de despliegue antes de habilitar datos reales.

## Pendientes explícitos

1. Conectar proyecto Supabase de pruebas, migración, Auth y correo autorizado; sin credenciales actualmente disponibles.
2. Superar aceptación alojada y móvil antes de fusionar/publicar.
3. Restauración entre espacios distintos, cambio de miembros y cambio de moneda base no permitidos en esta versión.
4. Recurrentes se registran conscientemente; no se ejecutan solos en servidor.
5. No se incorporan sincronización Personal, bancos, push ni adjuntos.
6. Las copias personales se deduplican en el mismo dispositivo mediante comprobantes locales que nunca viajan al servidor. Entre dispositivos no pueden deduplicarse globalmente sin compartir la identidad original. La revisión consciente evita exportaciones automáticas; UUID e idempotencia evitan duplicados por reintento.
7. Eliminaciones son tombstones: no hay purga permanente ni recuperación silenciosa. El procedimiento de conservación está en `COUPLE_SECURITY.md`.
