# Privacidad de LEDGER by ARX

Ledger es una PWA local-first. Los movimientos, importes, cuentas, saldos, presupuestos, objetivos, notas y deudas se guardan localmente en el dispositivo salvo que el usuario exporte una copia manualmente.

## Analítica opcional

La analítica de la beta es opt-in. Solo se activa tras consentimiento explícito y puede desactivarse desde Ajustes.

Proveedor: PostHog EU Cloud.

Controles:
- autocapture desactivado
- pageviews automáticos desactivados
- grabación de sesión desactivada
- heatmaps desactivados
- captura de consola desactivada
- captura de rendimiento desactivada
- perfiles personales desactivados
- sin nombre ni email enviados por Ledger
- allowlist de propiedades técnicas/producto

Eventos permitidos: sesiones, versión, plataforma, pantallas, uso de funciones, instalación y errores técnicos.

Nunca deben enviarse a analítica importes, movimientos, categorías financieras, notas, nombres de cuentas, saldos, presupuestos, deudas, archivos importados/exportados ni texto libre del usuario.

La clave local histórica `flowfi.public.v27` se conserva únicamente por compatibilidad de datos durante la migración FlowFi → Ledger.
