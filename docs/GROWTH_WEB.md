# Landing y calculadora de reparto — 23 octubre 2026

## Implementado

- `/descubre/`: presentación original de Ledger con identidad azul existente, propuesta de valor, funcionamiento Personal/Pareja, privacidad, instalación y FAQ. Solo describe capacidades presentes en el código. No muestra cifras de usuarios, testimonios, puntuaciones, supuestas capturas o resultados comerciales.
- `/reparto/`: calculadora funcional sin registro; ingresos netos A/B, alquiler/hipoteca y otros gastos. Compara 50/50 con proporcional, aportaciones, esfuerzo e ingreso restante después de los gastos comunes indicados. Todas las operaciones se hacen localmente. No contiene analítica ni persistencia.
- Validación de importes y límites, reparto exacto en céntimos mediante aritmética entera, casos de ingresos cero y aviso de déficit. El ejemplo está identificado como ficticio.
- Compartir usa una URL fija sin query ni fragmento, sin ingresos, importes o resultados; se ofrece copiar si Web Share no está disponible. El botón se llama «Compartir la calculadora» para expresar exactamente lo que comparte.
- Metadatos, canonical, Open Graph con el icono real de la app, datos estructurados SoftwareApplication/WebApplication, navegación semántica, salto a contenido, campos etiquetados y foco visible. No hay fuentes, SDK, imágenes o dependencias externas en estas páginas.
- Sitemap con las tres rutas públicas. No se ha enviado a Google Search Console ni se ha verificado indexación.

## Verificación

`node --test scripts/growth-tools.test.cjs`

Incluye cálculos, entradas inválidas, sumas exactas, redondeos, límites, ingreso cero, déficit, privacidad al compartir, interacción de la página real mediante JSDOM, metadatos/JSON-LD y enlaces locales. No sustituye una validación visual o en Safari físico.

## Integración por el propietario de la rama

Añadir la prueba anterior al comando principal de CI. Enlazar desde Ledger a `descubre/` y `reparto/` donde corresponda sin sustituir el inicio de la aplicación. Estas páginas no necesitan la caché financiera y no modifican `flowfi.public.v27`, el servicio de Pareja ni sus credenciales.

## Pendiente y límites SEO

Capturas reales de Personal y demo obtenidas mediante Chrome aislado en GitHub Actions, con datos ficticios, revisadas visualmente e incorporadas a la landing. [Método y resultado](BROWSER_VALIDATION.md). La emulación móvil no sustituye Safari/iPhone físico.

En GitHub Pages de proyecto, `https://thepunisher7777.github.io/ledger-app/robots.txt` **no es** el robots efectivo del dominio: los rastreadores consultan `https://thepunisher7777.github.io/robots.txt`. Se incluye el archivo como política preparada para un futuro alojamiento en raíz, pero no se afirma que cambie el rastreo del dominio. El sitemap público sí puede enviarse como URL completa a Search Console. Eso requiere acceso a una propiedad verificada; no se ha creado ni contratado nada.

La selección de consultas para el contenido es cualitativa, no una estimación de volumen: «calculadora gastos pareja», «reparto proporcional gastos pareja», «50/50 pareja ingresos diferentes», «control de gastos personales sin registro» y «app finanzas en pareja». No se atribuyen volúmenes ni dificultad sin una fuente verificable.

Precio de uso actual de estas herramientas: gratuito. No se ha conectado pasarela de pago, contratado servicios ni habilitado Premium.
