# Changelog

## Beta 1.3 — 2026-10-05

- Unificada la analítica de FlowFi/Ledger en PostHog EU.
- Preservado el consentimiento opt-in.
- Autocapture, grabación de sesión, pageviews automáticos, rendimiento y perfiles personales desactivados.
- Añadido filtro de propiedades de ARX Analytics.
- Retirado CounterAPI como backend externo; el formato legado solo se usa internamente como transporte de compatibilidad.
- Conservada la clave `flowfi.public.v27`.
- Conservado el puente seguro de migración FlowFi → Ledger.
- La nueva Ledger abre automáticamente el restaurador cuando llega desde `?migration=flowfi`.
