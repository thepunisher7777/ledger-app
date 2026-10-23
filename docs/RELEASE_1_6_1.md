# Aceptación y publicación 1.6.1 — 23 octubre 2026

## Alcance y autorización

Continuación del PR #6, sin proyecto nuevo. El propietario autorizó expresamente fusionar y publicar después de superar seguridad/integridad. Base de reversión: `c1d414530e9ba9c07c642d9b9927e54ff15f3bef` (1.6.0). Personal conserva `flowfi.public.v27`, schema 2 y claves `.safety`/`.corrupt`; no se ha leído/importado su backup personal.

## Comprobaciones ejecutadas

- `npm ci --ignore-scripts`, `npm test`, `python scripts/smoke_check.py`, `git diff --check`: aprobados localmente y en CI para los cambios correspondientes.
- Chrome real en Linux, escritorio y emulación móvil: diálogos, transacción/recarga, estadísticas, demo aislada, calculadora, diseño, privacidad y offline.
- Suite de navegador extendida a WebKit en macOS. Estado efectivo y capturas: jobs de Actions del último commit, no inferir éxito por la existencia del script. Ubuntu agotaba el tiempo descargando paquetes; macOS evita esas dependencias. La simulación `setOffline` de WebKit fallaba antes de entregar navegación al SW; se comprueba su caché y se provoca un fallo real de transporte cerrando la conexión del servidor. Se mantienen las mismas aserciones de navegación y datos.
- Actualización real del service worker 1.6.0 → 1.6.1 y reversión 1.6.1 → 1.6.0 en un origen aislado. Comprueba igualdad byte a byte de un backup ficticio y la versión efectiva. No modifica la producción.
- Aceptación alojada: **11 grupos aprobados** mediante `scripts/release-hosted.test.mjs`. Dos identidades recién creadas, sin espacios previos; SDK persistente reabierto, invitación, Sync con dos clientes, RLS/IDOR, edición simultánea, presupuestos/objetivos, fallo de conexión y reintento sin duplicar, recuperación con rotación de código/contraseña, JWT anterior rechazado, desvinculación y logout. No se han usado cuentas reales ni enviado eventos PostHog.
- Se cerró el espacio ficticio, ambos miembros abandonaron y sus sesiones se cerraron. El intento de limpieza administrativa devolvió `Invalid or expired requestState` dos veces; no se repite ni se declara limpieza completa. Las dos identidades y el archivo ficticio cerrado quedan sin sesiones activas. No hay datos del propietario en ese archivo.
- RLS de las cinco tablas confirmado; publicación Realtime de espacios, miembros y entidades confirmada. Sin migraciones, claves administrativas en cliente ni cambios de permisos.
- Dashboard 1049553 revisado y sus diez consultas ejecutadas. Hitos nuevos sin historia antes del despliegue; no se inflan métricas con pruebas. Consentimiento, lista cerrada de propiedades/valores y ausencia de importes/nombres/notas comprobados por suites locales y navegador.

## Supuestos financieros revisados sin datos personales

Se detectó y corrigió un fallo general: un préstamo con saldo cero seguía sumando cuotas a compromisos y previsiones. Ahora se excluye de previsión y se muestra liquidado, conservando cuota contractual e historial. Se prueban:

1. Préstamo cancelado + regla pausada conscientemente: no genera futuros compromisos. Una regla independiente aún activa no se desactiva automáticamente: el usuario debe pausarla en Plan.
2. Préstamo ficticio de coche: pago 110 = principal 100 + interés 10; saldo/historial sobreviven exportación/restauración sin aplicar otra vez el pago.
3. Saldo conciliado: ancla 1.000, movimiento anterior 400 y posterior 20 ⇒ 980; no se resta dos veces la historia anterior.
4. Ingreso extraordinario y cancelación como flujos explícitos independientes; no se reclasifica ni modifica un movimiento real.

## Despliegue y comprobación posterior

La fusión no acredita por sí sola publicación. Confirmar Actions/Pages para el SHA de merge, versión HTTP 1.6.1, assets/SW y rutas `/descubre/`, `/reparto/`, `/demo/`. Los jobs de navegador en `main` esperan hasta cinco minutos a Pages y después abren la web publicada en un perfil efímero, deniegan consentimiento antes de navegar y bloquean otros orígenes. Comprueban movimiento ficticio local, estadísticas, exportación JSON, recarga, calculadora y landing; no escriben en Supabase. La evidencia `public-<engine>.json` se adjunta al artifact.

La vía de reversión es un commit de revert de la fusión, nunca borrar datos ni reescribir `main`. La compatibilidad de almacenamiento y el cambio inverso del SW se prueban antes de fusionar. Si hay un fallo crítico posterior: conservar exportación, preparar revert en rama, ejecutar pruebas y publicar la reversión. No se ha provocado una reversión real de producción.

## Comprobación manual breve de iPhone

No se dispone de iPhone físico. WebKit automatizado y Chrome emulado se informan por separado y no equivalen a Safari real.

1. Abrir Ledger con conexión y consultar Beta 1.6.1; cerrar/reabrir la PWA si aún mantiene una pestaña antigua. **No borrar datos del navegador.** Guardar una copia JSON antes de cualquier cambio personal.
2. Leer movimientos/saldos habituales y seleccionar un ciclo futuro; comprobar que el contenido coincide con lo anterior.
3. Abrir la demo desde Ajustes, añadir/borrar un ejemplo y regresar: Personal debe permanecer igual.
4. Abrir la calculadora, mostrar teclado y verificar los botones con pantalla vertical. Añadir a pantalla de inicio mediante Safari → Compartir si procede.
5. Reabrir Pareja con sesión recordada; verificar el espacio autorizado. Probar sin conexión únicamente lectura local y luego reconectar. La recuperación real del propietario no forma parte de estas pruebas automáticas.

Esta revisión física queda pendiente y documentada; el propietario permite usar WebKit y un checklist manual cuando no se dispone del dispositivo. No se afirma instalación física iOS ni prueba de sus políticas de purga del almacenamiento.

## Costes y siguientes pasos

Cero servicios o suscripciones nuevos contratados. Premium continúa desactivado y Free intacto. Tras publicar: verificar acciones orgánicas sin emitir eventos ficticios, revisar activación/retención con consentimiento y ejecutar experimentos del plan de crecimiento hacia 50/100/300 identidades activas mensuales medidas. Search Console y validación física siguen pendientes; no se promete indexación, conversión ni ingresos.
