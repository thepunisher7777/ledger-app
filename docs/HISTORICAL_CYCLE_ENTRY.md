# Correcciones en ciclos históricos y selector — 18/11/2026

## Causas confirmadas

El formulario de alta siempre proponía la fecha de hoy, aunque se abriese desde un ciclo antiguo. Al confirmar sin cambiar la fecha, el movimiento pertenecía al ciclo actual. Además, el selector mostraba primero el ciclo actual y luego una lista ordenada desde el futuro más lejano: el siguiente elemento podía ser de 2027, aunque existiesen octubre/diciembre de 2026.

## Cambios

- Nuevo apunte en vista de ciclo: hoy si está dentro de sus límites, último día si es histórico, primer día si es futuro. La fecha sigue siendo editable; editar un apunte conserva su fecha original. El calendario conserva el día pulsado. Transferencias usan la misma regla.
- El formulario muestra el ciclo efectivo y sus fechas. Al introducir una fecha fuera del ciclo visible se solicita confirmación antes de guardar. No se fuerza una fecha incorrecta para aparentar que pertenece a otro ciclo.
- Lista de ciclos ascendente, sin duplicar el actual, con desplazamiento interior centrado en el seleccionado. Las flechas recorren meses consecutivos y el salto manual incluye los vecinos del destino. El acceso al ciclo actual sigue disponible.

Con inicio el 28, Octubre 2026 abarca 28/09–27/10; Noviembre, 28/10–27/11; Diciembre, 28/11–27/12. No se elimina noviembre ni se asocia el 28 de octubre a octubre de forma artificial.

No se modifica ningún movimiento existente ni backup real del propietario. Si el apunte erróneo ya se guardó con fecha de noviembre, el usuario puede editar su fecha o eliminarlo conscientemente. El saldo global de una cuenta puede cambiar al corregir historia; esto es distinto de que el gasto pertenezca al resultado de noviembre. No se cambia esa contabilidad global ni los saldos conciliados en esta corrección.

## Pruebas

`scripts/historical-cycle-entry.test.cjs`: reloj 18/11/2026, ingreso ficticio de devolución de 640 € en octubre y salario ficticio en noviembre. La contrapartida creada en octubre se fecha 27/10, corrige octubre y deja todos los totales de noviembre intactos. Fechas límite 27/28, cancelación/confirmación de cambio de ciclo, transferencias, fechas de edición, ciclos 1/15/28, orden Oct/Nov/Dic/Ene y saltos lejanos.

CI Chrome/WebKit móvil/escritorio valida que el ciclo activo esté visible al abrir el desplegable, orden real del DOM, captura del menú y alta de un gasto histórico con fecha persistida correcta. Sin Safari físico ni acceso a cuentas financieras reales.
