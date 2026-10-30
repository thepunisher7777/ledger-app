# Exportar por periodos — 29/10/2026

Los botones de exportación de Ajustes y Estadísticas abren el selector común: formato JSON/CSV/Excel; todos los datos, uno o varios ciclos no consecutivos, un día o intervalo inclusivo. La lista muestra el número de movimientos, los límites reales de cada ciclo y permite quitar/añadir meses. No depende de filtros visuales de cuenta o categoría; se exportan todos los movimientos de las fechas elegidas, incluidas transferencias. Las selecciones no modifican el estado financiero.

- JSON completo conserva el esquema de backup actual y todos sus módulos; se puede restaurar.
- CSV completo incluye todos los movimientos, como antes; no es un backup completo.
- Excel completo conserva sus hojas existentes y el periodo indicado en el resumen; Movimientos incluye todo el historial.
- JSON parcial contiene metadatos de selección/cambio, y los movimientos seleccionados. `_meta.partial` distingue el informe de un backup. La restauración lo rechaza explícitamente para evitar sustituir la app por un historial incompleto.
- Excel parcial incluye resumen calculado solo con los movimientos seleccionados, categorías y días con actividad. No incluye saldos actuales, préstamos, reglas u objetivos ajenos al periodo. No representa un saldo bancario histórico. Las conversiones usan el cambio configurado/exportado, igual que las estadísticas actuales.
- CSV parcial conserva las columnas de importación y los IDs para mantener compatibilidad; se pueden reimportar movimientos siguiendo las protecciones de duplicados existentes.

No se cambia la exportación de Pareja: sigue siendo independiente. El selector Personal está bloqueado cuando Pareja está activa. No hay operaciones de servidor ni envío de importes a analítica; se conservan los eventos de exportación existentes sin propiedades de selección.

Pruebas: `scripts/export-selection.test.cjs` valida los archivos reales, ciclos 28–27, fechas límite, ciclos no consecutivos, duplicados de selección, día/rango/vacío, rechazo de fechas inválidas, backup completo y ausencia de datos ajenos al periodo o mutaciones. CI Chromium/WebKit descarga un informe por día y verifica su contenido; comprueba también el backup completo sobre la publicación exacta y la actualización offline.
