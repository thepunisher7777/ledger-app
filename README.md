# LEDGER by ARX — Beta 1.1

Beta 1.0 + seguimiento anónimo opcional para testers.

Con consentimiento mide sesiones, usuarios activos agregados, instalaciones, versión, plataforma, pantallas, uso de funciones y errores técnicos como contador. No envía movimientos, importes, categorías, notas, cuentas, saldos, presupuestos, préstamos/deudas ni archivos.

La analítica se puede desactivar en Ajustes.

## Panel

Sube `metrics.html` y abre:

https://thepunisher7777.github.io/ledger-app/metrics.html

Se mantiene `flowfi.public.v27`.

Archivos: index.html, sw.js, manifest.webmanifest, icon-192.png, icon-512.png, apple-touch-icon.png, metrics.html, README.md.


## Migración segura

Esta build está preparada para convivir temporalmente con `flowfi-app`: el service worker usa una caché propia con prefijo `ledger-app-` y no borra las cachés de la app antigua. La clave de datos sigue siendo `flowfi.public.v27` para mantener compatibilidad con los datos existentes bajo el mismo origen.
