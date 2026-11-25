# Orden de movimientos — 25/11/2026

Personal y Pareja ofrecen Fecha: más recientes / más antiguos e Importe: mayor a menor / menor a mayor. Ordenar nunca modifica movimientos, saldos, recurrencias, préstamos o su sincronización.

- Personal combina el orden con ciclo/periodo, categoría, búsqueda y filtro de ingresos/gastos/transferencias. Conserva búsqueda, tipo y orden mientras se navega y se vuelve a renderizar en la sesión. No se añade nada al backup financiero ni se persiste una búsqueda privada en otra integración.
- El importe se compara por magnitud positiva en moneda base, usando la conversión existente. Al filtrar una categoría de un gasto dividido se compara el importe de esa categoría, que es el mostrado. Las transferencias usan el importe de origen convertido; importes sin cambio válido van al final en ambos sentidos.
- Pareja tiene sus propios controles independientes para gastos, ingresos, aportaciones y compensaciones. Compara base_minor calculado por su contabilidad existente; no consulta el almacenamiento Personal.
- Empates: fecha, momento de creación, ID y posición original para garantizar estabilidad. El orden inicial sigue siendo fecha descendente. No se modifica el array original.
- El módulo local movement-sort.js se incluye en la caché offline. Si no está disponible, el selector se desactiva y se conserva el listado anterior.

Pruebas: scripts/movement-sort.test.cjs valida los cuatro órdenes, filtros combinados, EUR/USD, empates, importes no convertibles, vacío y ausencia de mutaciones; couple-ui.test.cjs comprueba el DOM compartido y aislamiento. CI Chromium/WebKit móvil/escritorio usa un contexto independiente con cuatro movimientos ficticios para cada orden/filtro y captura la interfaz. La prueba sobre Pages verifica el selector real con analítica denegada y un gasto ficticio aislado. No se usan datos financieros reales.
