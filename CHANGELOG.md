# Changelog

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
