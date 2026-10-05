# LEDGER by ARX · Beta 1.5.0 — International hotfix

PWA local-first de finanzas personales.

## Beta 1.5.0
- Selector de idioma en Ajustes.
- Modo Automático según el idioma del dispositivo.
- Español, English, Français, Deutsch, Italiano y Português.
- Fechas y formatos monetarios adaptados al locale seleccionado.
- Las categorías internas y la estructura de los backups NO cambian al traducir la interfaz.
- PostHog EU opt-in, sin datos financieros.
- Receptor seguro de migración FlowFi → Ledger.
- Clave histórica `flowfi.public.v27` preservada por compatibilidad.

App: https://thepunisher7777.github.io/ledger-app/

## Beta 1.5.0
- Hotfix de traducciones mixtas en textos dinámicos y tarjetas de Inicio, Estadísticas, Plan y Ajustes.
- Traducción de etiquetas de sistema dentro de líneas combinadas sin modificar los datos guardados.

## Multidivisa

En Ajustes, crea cuentas EUR o USD y elige la moneda base. En Estadísticas, «Cuentas y divisas» muestra saldos actuales y gráficos por cuenta/divisa. El cambio diario BCE se guarda localmente; puedes desactivar su consulta automática y usar uno manual. Las transferencias entre divisas piden el importe recibido real. El patrimonio y los resúmenes se valoran al último tipo guardado, no al cambio histórico. Los préstamos y objetivos tienen su divisa; las cuotas exigen una cuenta de la misma moneda. Los presupuestos y el ahorro mensual existentes conservan EUR.

El importador XML de Portfolio Performance ofrece una **vista previa sin escritura**. Lee cuentas EUR/USD y movimientos de efectivo; señala valores, referencias y transferencias que necesitan mapeo. No importa posiciones ni rentabilidad de inversiones. Usa JSON para una copia completa de Ledger; CSV exporta movimientos y Excel incluye sus denominaciones.

Sin login obligatorio. La sincronización futura será opcional.
