# Cuotas de préstamo como fijo — 30/10/2026

## Causa
Los fijos generaban gastos normales con recurringId. Solo el formulario de cuota individual llamaba a applyLiabilityPayment. Por tanto, un gasto llamado «coche» no podía reducir una deuda sin vínculo explícito.

## Uso
En Plan → Movimientos fijos → Editar, seleccionar Préstamo vinculado. Debe ser un gasto, con cuenta de la misma divisa que el préstamo. No se deduce el préstamo por nombre, importe o categoría.

- Registros posteriores manuales o automáticos actualizan gasto, capital, interés e historial en el mismo guardado. Si falla, se restauran ambos estados.
- Se utiliza el cálculo mensual ya existente (capital pendiente × TIN/12); son registros contables estimados, no una consulta al banco ni un cuadro contractual recalculado.
- Una cuota mensual por préstamo/mes calendario, aunque haya otras reglas para el mismo préstamo. Se rechazan cuotas anteriores a otras posteriores del historial. Las amortizaciones extra siguen siendo independientes.
- La última cuota automática se limita al saldo más el interés estimado; al liquidarse cesa la generación y sus compromisos recurrentes.
- Las previsiones de préstamos vinculados cuentan la cuota una vez, sin sumar fijo y préstamo.
- Borrar/Deshacer un gasto conserva la reversión/restauración existente del capital e historial. Borrar la regla conserva pagos y préstamo.

## Gastos ya generados
Tras vincular la regla, cada gasto del ciclo con recurringId y sin préstamo ofrece Aplicar al préstamo. La confirmación advierte que el saldo pendiente no debe incluir ya esa cuota. Actualiza el gasto existente sin crear otro ni repetir la amortización. Nunca se reparan automáticamente historiales reales: podrían estar ya reflejados en un saldo conciliado manualmente. Para movimientos sin recurringId, se usa la edición de movimiento/vinculación existente.

## Validación
scripts/recurring-loan.test.cjs cubre principal/intereses, deuda, historial, restauración/reinicio, final de préstamo, duplicado mensual, divisas, borrado/Deshacer, edición, vinculación de gasto existente, cancelación y fallo de almacenamiento. CI Chrome/WebKit prueba el selector real y aplicar un gasto ficticio ya generado, recarga y eliminación de la regla sin perder pagos. Ningún dato del propietario se lee o modifica en estas pruebas.
