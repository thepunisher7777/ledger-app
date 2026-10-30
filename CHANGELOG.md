## Beta 1.6.2 — 2026-10-29

- Fijos vinculados explícitamente a préstamos: cuota con capital/intereses, deuda e historial actualizados, control mensual de duplicados y última cuota limitada al saldo. Aplicar un gasto ya registrado al préstamo exige confirmación y no crea otro movimiento.

- Exportación con selector de todos los datos, varios ciclos, día o rango inclusivo en CSV, Excel y JSON. Los informes parciales excluyen módulos ajenos al periodo y no se pueden restaurar como copias completas.

- Guardados de fijos, objetivos, categorías y préstamos y Deshacer conservan el estado anterior si falla el almacenamiento, sin confirmar un éxito falso.
- Al editar un apunte fijo se elige solo este movimiento (predeterminado) o actualizar también la regla para próximos registros.
- Botón Eliminar en cada movimiento fijo, activo o pausado: confirmación, conservación del historial y cancelación segura si falla el guardado.

- Gastos fijos revisados: alta automática de vencidos al abrir o volver a la app, una ocurrencia por ciclo y sin generar ingresos o fechas futuras.
- Las reglas antiguas requieren una revisión única para evitar reactivar gastos cancelados. Coincidencias manuales dudosas quedan pendientes de revisión, sin duplicar apuntes.
- Los fijos sin registrar siguen reservados en el disponible aunque su fecha haya pasado. Lista visible de previstos en Inicio.
- Nombres completos en Plan: acciones en fila independiente y títulos multilínea.
- Respeta borrados por ciclo, pausas, moneda, copias existentes y saldos conciliados anteriores al alta automática.
- Pruebas con ciclos 28–27, meses cortos, límites de año, reinicios, importaciones y fallos de almacenamiento. Sin cambios de datos financieros en el servidor.

## Beta 1.6.1 — 2026-10-23

- Guía de tres pasos reabrible y demo funcional independiente, en memoria y con datos ficticios.
- Landing y calculadora local de reparto 50/50 o proporcional, con SEO y enlaces compartibles sin importes.
- Descarta respuestas Auth/RPC/lecturas de sesiones antiguas después de cerrar sesión; pruebas de carrera.
- Telemetría con consentimiento: hitos y acciones de valor, validación de eventos y valores, sin geolocalización, URLs ni datos financieros. Se deja de emitir la falsa «instalación» de primera medición.
- Corrección de Response 204 con cuerpo, guardas sin sondeo periódico, actividad al volver a la app y deduplicación de hitos.
- Caché offline por ruta y lista cerrada de recursos públicos; evita sustituir demo/landing por el inicio.
- Presupuesto solo se confirma cuando se guarda; zoom móvil habilitado. Pruebas ampliadas y documentación real de métricas/Premium.
- Préstamos liquidados excluidos de compromisos/previsiones; historial conservado. Validación alojada de dos identidades ficticias y suite WebKit/actualización/reversión de PWA.
- Sin migraciones, cambios de datos reales, pagos ni restricciones de funciones gratuitas. Estado de publicación en el PR.

## Beta 1.6.0 — Ciclos futuros — 2026-10-23

- Selector mensual con próximos 12 ciclos, todos los ciclos con movimientos registrados y salto directo a cualquier mes.
- Botones anterior/siguiente y rangos de fechas para localizar y corregir movimientos futuros, también al cambiar de año.
- El día de inicio configurado se respeta: con inicio el 28, el 28 de octubre pertenece al ciclo de noviembre.
- Editar/eliminar un movimiento futuro utiliza las acciones existentes; eliminar una ocurrencia conserva la regla recurrente. Navegar no genera pagos.

## Beta 1.6.0 — Persistencia de Pareja — 2026-10-20

- Mantener sesión activado por defecto en la conexión publicada, con opción para desactivarlo al entrar en dispositivos compartidos.
- Restauración del último espacio seleccionado y de la sesión al reabrir o volver desde segundo plano.
- Reconfigurar la conexión ya no cierra una sesión de forma asíncrona; el cierre explícito sigue revocando acceso y limpiando la caché compartida.
- Los tokens siguen renovándose con Supabase; no se almacenan contraseñas ni códigos de recuperación ni se alarga la vigencia del JWT.

## Beta 1.6.0 — 2026-10-10

- Modo Pareja nativo disponible con conexión pública preparada, sin configuración técnica manual.
- Usuario/contraseña, recuperación sin correo e invitación privada con caducidad.
- Personal conserva almacenamiento, funcionalidades y backups; no se sincroniza automáticamente.
- Publicación autorizada por el usuario tras probar la vista previa. Regresiones y permisos validados con datos ficticios.

## Beta 1.6.0 Couple Preview 2 — 2026-10-10

- Identidad Pareja con usuario/contraseña y recuperación mediante secreto de 256 bits, sin SMTP ni Brevo.
- Invitaciones por enlace/código mantienen aceptación explícita, caducidad y separación Personal/Pareja.
- Endpoint server-only con límites persistentes y RPC administrativas inaccesibles a clientes.
- Recuperación rota el código y revoca sesiones antiguas; conserva el UUID y el espacio.
- Pruebas de permisos, recuperación y acceso HTTP con usuarios ficticios. Producción permanece intacta.

# Changelog

## Beta 1.6.0 Couple Preview 1 — 2026-10-09 (no publicada)

- Selector Personal/Pareja integrado en la app original. Personal, `flowfi.public.v27`, importaciones, backups y multidivisa permanecen independientes, sin login obligatorio.
- Migración PostgreSQL con RLS, RPC autorizadas, dos miembros, invitaciones privadas de 256 bits/24 horas y auditoría con autor/editor servidor.
- Autorización verifica sesión Auth viva y su propietario, además de membresía: un JWT anterior no conserva acceso después de logout. Rechaza sesiones expiradas y anónimas.
- Movimientos, repartos exactos, fondos, aportaciones, compensaciones sin doble gasto, presupuestos, objetivos, estadísticas y registro consciente de reglas recurrentes.
- Cola local por proyecto/usuario/espacio, UUID/idempotencia, CAS y propuestas de conflicto separadas; caché offline hasta 15 minutos desde verificar acceso, sesión persistente opt-in.
- Copia personal saneada con revisión/confirmación. Exportación y restauración Pareja del mismo espacio con revisión, deduplicación y control de versiones; cierre/revocación sin tocar datos personales.
- CI amplía regresiones con autorización PostgreSQL, dos clientes/HTTP local, contabilidad, offline, conflictos y DOM. SDK Supabase oficial fijado y servido localmente.
- Enlace privado de invitación con botones copiar/compartir, caducidad de 24 horas y aceptación explícita tras autenticación. El token se retira de la URL antes de inicializar analíticas.
- Proyecto de pruebas Supabase Free configurado; 12 comprobaciones alojadas Auth/HTTP/Realtime aprobadas. Conflictos de negocio devuelven HTTP 409 y no desencadenan reintentos de serialización.
- Pendiente SMTP para OTP público y aceptación Safari/iPhone. No despliegue de producción, automatizaciones Work ni servicios de pago.

## Beta 1.5.0 — Multidivisa (2026-10-05)

- Cuentas EUR/USD con saldos, movimientos, conciliación y movimientos fijos en su divisa original.
- Moneda base EUR/USD para resúmenes, patrimonio, préstamos, compromisos y objetivos vinculados. El cambio de base no reescribe importes originales. Los presupuestos y el ahorro mensual antiguos siguen denominados en EUR.
- Cambio diario de referencia BCE vía Frankfurter, actualización automática opcional, caché local y tipo manual. Se muestra fuente/fecha; sin tipo válido no se inventa una equivalencia. Valoraciones históricas usan el último cambio guardado, no tipos históricos.
- Transferencias con importe enviado y recibido, respetando el cambio real introducido y excluidas de ingresos/gastos.
- Gráficas de ingresos/gastos y evolución de saldo desde conciliación por cuenta, filtros de cuenta/divisa y saldos agrupados sin sumar EUR con USD.
- CSV con divisas, ambos importes de transferencia y repartos. Importación preparada en memoria y persistida de forma atómica; rechaza monedas incompatibles y mantiene deduplicación.
- Excel incorpora moneda base, tipo/fecha y divisas originales.
- Portfolio Performance XML: vista previa local de cuentas EUR/USD y efectivo, escala de importes comprobada y avisos de valores/transferencias/referencias no mapeados. **Todavía no importa ni reconstruye una cartera de valores**; no modifica datos existentes.
- Conservados `flowfi.public.v27`, esquema 2, backups JSON, recuperación local y migración FlowFi. Campos nuevos aditivos; copias antiguas EUR siguen funcionando en esta versión. No se garantiza abrir nuevas copias multidivisa en versiones antiguas.
- Sin login obligatorio ni sincronización activada. CI incluye las regresiones existentes, pruebas multidivisa/XML y service worker.


## Beta 1.4.2 — Audit fixes — 2026-10-05

- Reject impossible dates and non-finite transaction amounts.
- Validate backup structures before replacing financial state.
- Clear split allocations when converting an expense into a transfer.
- Include transfers in account totals when reconciliation anchors differ.
- Cap simulated one-off repayment at outstanding principal.
- Preserve custom categories linked to recurring payments or budgets.
- Escape custom icons and imported source labels before rendering.
- Isolate service-worker caching to successful same-origin responses.
- Add synthetic DOM regression coverage across all six languages.


## Beta 1.4.1 — International hotfix — 2026-10-05

- Corregidos textos españoles residuales al usar English, Français, Deutsch, Italiano y Português.
- Añadidas traducciones de Inicio, compromisos, métricas, ajustes y textos explicativos.
- Corregidas líneas dinámicas que mezclaban categorías traducidas con etiquetas de sistema en español.
- No se modifican movimientos, importes, cuentas, backups ni `flowfi.public.v27`.


## Beta 1.4 — International — 2026-10-05

- Añadido selector de idioma en Ajustes.
- Añadido modo Automático usando el idioma del dispositivo.
- Añadidos Español, English, Français, Deutsch, Italiano y Português.
- Fechas y formato de moneda siguen el locale de la interfaz.
- Traducción visual de categorías manteniendo las claves internas originales.
- Nueva preferencia local `ledger.ui.language.v1`; no modifica `flowfi.public.v27`.
- `i18n.js` funciona como capa de interfaz y no accede a movimientos, importes, cuentas ni deudas.
- Conservados PostHog EU, migración FlowFi y compatibilidad de backups.

## Beta 1.3 — 2026-10-05

- Unificada la analítica de FlowFi/Ledger en PostHog EU.
- Preservado el consentimiento opt-in.
- Autocapture, grabación de sesión, pageviews automáticos, rendimiento y perfiles personales desactivados.
- Añadido filtro de propiedades de ARX Analytics.
- Retirado CounterAPI como backend externo; el formato legado solo se usa internamente como transporte de compatibilidad.
- Conservada la clave `flowfi.public.v27`.
- Conservado el puente seguro de migración FlowFi → Ledger.
- La nueva Ledger abre automáticamente el restaurador cuando llega desde `?migration=flowfi`.

### Beta 1.4.2 recovery follow-up — 2026-10-05

- Prevent false successful backup restore when local persistence fails; preserve previous memory and safety recovery snapshot.
- Validate local safety copies before recovery and clear stale editing/undo state after success.
- Add full exported-backup recovery comparisons for a recurring bill, paid loan and payday-based cycle across all six languages, including fresh startup and repeated restore.
- Refresh the PWA shell cache for the recovery fix.
