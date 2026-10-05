# Changelog

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
