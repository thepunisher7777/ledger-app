# Validación de navegador reproducible

Continuación del 23 octubre 2026 sobre PR #6. No cambia la versión pública ni usa cuentas/datos reales.

## Método

`npm run test:browser` utiliza `playwright-core` **1.62.1**, fijado como dependencia de desarrollo y sin scripts de instalación. Controla un Chrome existente con `CHROME_BIN=/ruta/al/google-chrome`. No añade un navegador a la distribución PWA ni una dependencia de producción.

GitHub Actions ejecuta el job `Real Chrome desktop and mobile regression` en `ubuntu-24.04`, usando `/usr/bin/google-chrome`. La [imagen oficial](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md#browsers-and-drivers) incluye Chrome. El job usa permisos `contents: read`, no recibe credenciales de Supabase y no despliega. Sus capturas/evidencias ficticias se guardan como artifact `ledger-browser-evidence` durante siete días.

El servidor de prueba solo escucha `127.0.0.1` y reproduce el subdirectorio `/ledger-app/`. Cada resolución usa un contexto nuevo e independiente:

- Escritorio 1440 × 1000.
- Emulación móvil táctil 390 × 844. Es Chrome emulado, **no Safari ni iPhone físico**.

Todas las solicitudes a otros orígenes se bloquean antes de llegar a Internet; la prueba falla si intenta usar PostHog o CounterAPI sin consentimiento. No se conecta a Auth, base de datos, bancos ni tipos de cambio de producción.

## Comprobaciones reales

1. Abrir/cerrar la guía y el consentimiento mediante diálogos nativos.
2. Crear desde la interfaz un gasto ficticio de 12,34 €, comprobar almacenamiento y recarga.
3. Abrir estadísticas.
4. Añadir un movimiento en la demo sin alterar la copia Personal ficticia.
5. Calcular el ejemplo identificado y comprobar su total.
6. Detectar desbordamiento horizontal en app, demo, calculadora y landing.
7. Instalar el service worker real, cortar conexión y navegar entre demo, calculadora e inicio con sus recursos correctos.
8. Conservar la copia Personal ficticia, no lanzar errores de JavaScript y no intentar analítica sin consentimiento.

Las capturas se generan con un navegador real; todo dato financiero visible ha sido creado por la prueba. Se deben revisar visualmente antes de incorporarlas a la landing. `evidence.json` registra la versión efectiva del navegador y los grupos de comprobaciones completados.

## Ejecución y límites

En este contenedor había Playwright, pero no un navegador instalado. El intento de descarga oficial de Chrome Headless Shell devolvió un archivo truncado («End of central directory record signature not found»); no se ha declarado una prueba local de navegador satisfactoria. Se utiliza el runner de GitHub para verificar el mismo código y conservar evidencias.

El resultado efectivo debe comprobarse en el job de Actions del commit correspondiente. Crear este script no demuestra que lo haya superado. Esta suite complementa `npm test`; no ejecuta recuperación alojada, dos identidades reales, Safari, instalación iOS o sincronización física entre dispositivos. Esas validaciones siguen separadas y no se sustituyen por cambiar el tamaño de la pantalla.

## Resultado verificado

[Actions 39978291955](https://github.com/thepunisher7777/ledger-app/actions/runs/39978291955), commit `05bef2851b2525119fa2e44205229b2393784b4b`: job de navegador y regresiones aprobados. Chrome efectivo **155.0.8059.39**. Los dos contextos completaron los nueve grupos; cero orígenes externos intentados en esa ejecución. Evidencia conservada en [browser-evidence-20261023.json](browser-evidence-20261023.json). Las capturas de Personal y demo se han revisado visualmente e incorporado a `assets/screenshots/` con etiquetas de datos ficticios en la landing.

La primera ejecución falló por un selector de prueba que exigía atributo `type=submit` explícito en un botón HTML que ya era submit por defecto. Se corrigió el selector; no era un fallo de guardado de la demo. El job alojado de recuperación continúa omitido intencionadamente.
