# Changelog

## Beta 1.6.0 Couple Preview 1 — 2026-10-09 (no publicada)

- Selector Personal/Pareja integrado en la app original. Personal, `flowfi.public.v27`, importaciones, backups y multidivisa permanecen independientes, sin login obligatorio.
- Migración PostgreSQL con RLS, RPC autorizadas, dos miembros, invitaciones privadas de 256 bits/24 horas y auditoría con autor/editor servidor.
- Movimientos, repartos exactos, fondos, aportaciones, compensaciones sin doble gasto, presupuestos, objetivos, estadísticas y registro consciente de reglas recurrentes.
- Cola local por proyecto/usuario/espacio, UUID/idempotencia, CAS y propuestas de conflicto separadas; caché offline hasta 15 minutos desde verificar acceso, sesión persistente opt-in.
- Copia personal saneada con revisión/confirmación. Exportación y restauración Pareja del mismo espacio con revisión, deduplicación y control de versiones; cierre/revocación sin tocar datos personales.
- CI amplía regresiones con autorización PostgreSQL, dos clientes/HTTP local, contabilidad, offline, conflictos y DOM. SDK Supabase oficial fijado y servido localmente.
- Pendiente proyecto Supabase autorizado, correo OTP y aceptación alojada/móvil. No despliegue de producción, automatizaciones Work ni servicios de pago.

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
