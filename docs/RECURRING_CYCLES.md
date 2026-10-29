# Fijos entre ciclos — Beta 1.6.2, 29/10/2026

## Fallo encontrado

1. Las reglas se guardaban en `state.recurring`, pero solo creaban movimientos al pulsar Registrar; no existía procesamiento de vencimientos al abrir o volver a la app.
2. El disponible dejaba de reservar una regla sin registrar cuando su fecha ya había pasado. Por tanto, podía aparentar más dinero libre sin que existiera su gasto.
3. En móvil, icono/importe/Registrar/Editar/Pausar ocupaban una única fila flexible y comprimían el título hasta una inicial.

## Solución

- Motor local `ledger-recurring.js`, sin backend ni analítica, reutilizando los límites del ciclo y su calendario real.
- Revisión única de reglas antiguas: el usuario marca las que siguen activas; desmarcar pausa sin borrar historial. Evita generar automáticamente un gasto cancelado o una regla antigua sin revisar. Las reglas nuevas permiten elegir registro automático o manual.
- Los gastos revisados con `autoRecord=true` se registran a su vencimiento al abrir o volver a Ledger. Solo el ciclo actual: no reconstruye meses anteriores ni contabiliza fechas futuras. No crea ingresos (la nómina introducida manualmente se conserva).
- Una ocurrencia determinista por regla/ciclo. Se reconocen referencias ya registradas, movimientos manuales/importados descriptivamente equivalentes y borrados voluntarios. Las coincidencias dudosas se dejan sin duplicar y se pueden vincular al apunte existente desde Plan.
- Borrar un fijo registrado omite esa ocurrencia del ciclo; Deshacer la recupera. Pausar sigue afectando solo a futuros registros, sin borrar la historia.
- El disponible reserva todos los fijos pendientes del ciclo, también vencidos, y los muestra en un desplegable de Inicio. Los futuros se ven como previstos, no como pagos hechos.
- Los apuntes automáticos tienen fecha efectiva para respetar un saldo ya conciliado después de esa fecha. `createdAt` conserva la fecha de creación técnica. No se accede a bancos ni se confirma un cargo real.
- Títulos completos y multilínea; botones en una fila separada, en Plan e Inicio.
- Se conserva `flowfi.public.v27`, esquema 2 y compatibilidad JSON. Los metadatos opcionales `autoRecord`, `skippedCycles`, `recurringCycle`, `autoRecurring` y `balanceEffectiveAt` sobreviven a exportación/restauración. No se suben datos personales.

## Límites

Los datos Personal están en el dispositivo. Publicar el arreglo no permite inspeccionar ni corregir su lista real desde el repositorio. Al abrir la versión nueva, revisar las reglas antiguas una vez, especialmente gastos cancelados. La automatización se ejecuta con la app abierta/al reanudarla, no mediante un servidor mientras está cerrada. Préstamos mantienen su circuito de amortización existente.

## Verificación

`node scripts/recurring-cycle.test.cjs`: ciclo 28 octubre–27 noviembre, vencidos/futuros, ingresos y pausas, primera revisión, repetición/reinicio, backup, coincidencias manuales, borrado/deshacer, almacenamiento fallido, saldo conciliado y límites febrero/año.

Prueba nativa de navegador para Chrome y WebKit: dos reglas ficticias antiguas, revisión que pausa una cancelada, una sola ocurrencia tras recarga y nombre largo completo en móvil/escritorio. El test DOM anterior de Pareja fijaba un movimiento al 9 de octubre pero usaba el ciclo de la fecha real; se fija su reloj financiero al 23 para evitar que el cambio de ciclo invalide una prueba ajena al cambio.

Resultados definitivos, commit y despliegue: CI y PR de esta revisión. No se afirma haber revisado el backup personal del propietario ni haber instalado la PWA en su iPhone físico.
