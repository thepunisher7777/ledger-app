# Ledger: crecimiento orgánico y preparación de Premium

Investigación y propuestas revisadas el **23 de octubre de 2026**. Este documento no activa cobros, suscripciones, restricciones ni envíos externos. Las propuestas pendientes no se anuncian como prestaciones disponibles.

## 1. Punto de partida comprobado y límites

La rama de trabajo parte del código de Ledger Beta 1.6.0, incluido el selector de ciclos futuros y la persistencia de sesión de Pareja. El código ofrece Personal local, importaciones/exportaciones, presupuestos, estadísticas, EUR/USD y Pareja mediante Supabase. La vista previa XML de Portfolio Performance no importa una cartera completa. Los tipos utilizados para patrimonio personal no representan por sí solos una serie histórica de cambios.

La sincronización Personal entre dispositivos, backups automáticos en la nube y tareas programadas no se deben anunciar como existentes. Tampoco se deben presentar las reglas recurrentes manuales como cargos bancarios o automatizaciones ejecutadas con la página cerrada.

El inicio del README heredado todavía describía una vista previa 1.5.0 sin conexión, mientras su final describía Pareja publicada. Esa contradicción requiere corregirse en la auditoría principal: para comunicar el estado usar el código, los commits, los despliegues y las pruebas, no un párrafo obsoleto.

Las cifras de PostHog del encargo son una referencia histórica que el responsable de la auditoría debe reconsultar. Este documento no las revalida ni las trata como métricas actuales. Las identidades anónimas no equivalen necesariamente a personas; visitantes, actividad, instalaciones y acciones financieras deben tener definiciones distintas. La analítica voluntaria tampoco permite inferir el total real de usuarios.

## 2. Competidores: precios primarios observados

Precios mostrados por las páginas oficiales o las fichas de sus desarrolladores en App Store España. Un SKU visible no demuestra su disponibilidad para todas las cuentas, ofertas ni periodicidad. No se han convertido USD a EUR ni se han realizado compras.

| Producto y canal | Precio mensual comprobable | Precio anual comprobable | Lectura para Ledger |
| --- | --- | --- | --- |
| Spendee Premium, App Store España | 6,99 €, etiqueta «Monthly» | 39,99 €, etiqueta «Yearly» | Referencia de suscripción con prestaciones conectadas; no comparar como si Ledger ya ofreciera conexión bancaria. |
| Control Gastos: Bolsillo, App Store España | 4,99 €, etiqueta «Premium mensual» | 24,99 €, etiqueta «Premium anual» | Competidor cercano en registro manual y privacidad. Ledger a 29,99 €/año no sería la opción anual más barata de esta muestra. |
| YNAB, web oficial | 14,99 USD, más impuestos cuando corresponda | 109 USD, más impuestos cuando corresponda | Servicio de presupuesto de otro alcance. La ficha española muestra 15,49 € y 119 €, pero «YNAB Subscription» no identifica el periodo de cada SKU en la evidencia recuperada. No se asignan esos importes a mes/año como hecho comprobado. |
| Wallet, App Store España y centro oficial | No confirmado con periodicidad inequívoca | No confirmado con periodicidad inequívoca | La ficha lista importes Premium de 5,99 €, 17,99 € y 29,99 €, además de «Lifetime Premium 29,99 €» y «3-Year Premium 59,99 €». El centro oficial remite al precio mostrado en la app. No reutilizar descripciones antiguas como tarifa actual. |
| Splitwise Pro, App Store España | No confirmado con periodicidad inequívoca | No confirmado con periodicidad inequívoca | SKUs observados de 2,99 €, 3,99 €, 29,99 € y 47,99 €, todos denominados «Splitwise Pro». No se puede deducir de esta lista cuál es mensual, anual, antiguo o promocional. |
| Actual Budget, software oficial | Núcleo gratuito y abierto | Núcleo gratuito y abierto | Existe competencia gratuita centrada en propiedad de datos. Alojamiento, operación y servicios opcionales pueden tener costes aunque el código sea gratuito. |

Spendee también publica en su web 5,99 USD/mes y 35,99 USD/año para Premium y 1,99 USD/mes y 14,99 USD/año para Plus; advierte variación por país. Son precios de otro canal, no conversiones de los precios españoles. Splitwise anuncia en su web funciones Pro, pero no una tarifa pública inequívoca. Las afirmaciones comerciales de los proveedores no son una auditoría independiente de su seguridad o calidad.

Fuentes primarias, consultadas el 23-10-2026:

- Spendee web: https://www.spendee.com/pricing
- Spendee España: https://apps.apple.com/es/app/spendee-money-gestor-de-gastos/id635861140
- Bolsillo España: https://apps.apple.com/es/app/control-gastos-bolsillo/id6797303861
- YNAB web: https://www.ynab.com/pricing
- YNAB España: https://apps.apple.com/es/app/ynab/id1010865877
- Wallet España: https://apps.apple.com/es/app/wallet-finanzas-personales/id1032467659
- Wallet, centro oficial: https://support.budgetbakers.com/hc/es/articles/7151349344018-Todo-sobre-Premium
- Splitwise Pro: https://www.splitwise.com/pro
- Splitwise España: https://apps.apple.com/es/app/splitwise/id458023433
- Actual: https://actualbudget.org/ y https://github.com/actualbudget/actual

## 3. Hipótesis de precio y validación de disposición a pagar

**3,99 €/mes y 29,99 €/año son hipótesis, no una tarifa activada.** Doce mensualidades sumarían 47,88 €; 29,99 € anuales equivalen a aproximadamente 2,50 €/mes y un descuento del 37,4 % sobre doce mensualidades. Un descuento así reduce ingreso por cliente y debe justificarse por permanencia, costes y valor real, no copiarse de la competencia.

No hay evidencia de disposición a pagar de los usuarios de Ledger en esta investigación. Un clic en «Me interesa» mide interés declarado, no una compra ni una tasa de conversión. La comparación de precios no demuestra cuál aceptará este público.

Secuencia de validación propuesta:

1. Corregir activación y retención, con una definición de acción de valor y consentimiento. Observar al menos varias cohortes completas; una muestra pequeña no permite estimaciones comerciales fiables.
2. Ofrecer una encuesta opcional, sin pedir ingresos ni balances: qué problema sigue sin resolver, cuál de tres prestaciones usaría cada semana, y si preferiría pago mensual, anual o seguir en Free. No recopilar correo como requisito para responder.
3. Mostrar una propuesta claramente etiquetada «en estudio», con descripción concreta de una prestación. Si se mide un clic, usar un evento permitido y consentido sin respuestas abiertas ni datos financieros.
4. Con autorización posterior, realizar entrevistas o un piloto con condiciones explícitas. No mandar invitaciones ni contactar a personas en esta fase.
5. Evaluar valor, uso semanal, coste por usuario y soporte antes de decidir precio o cobro. No cobrar por una prestación que aún no funciona ni interpretar ausencia de quejas como validación.

El objetivo de 500–600 € netos mensuales no se deriva de los usuarios actuales. Como simple referencia aritmética de **facturación bruta**, 126–151 suscripciones a 3,99 €/mes sumarían aproximadamente 503–602 €/mes; 201–241 planes anuales a 29,99 € representarían aproximadamente 502–602 €/mes de ingreso anual prorrateado. Esos números no incluyen bajas, impuestos, comisiones, infraestructura, soporte ni captación, y por tanto no representan beneficio neto ni una previsión de ventas. No se aplica ninguna tasa de conversión supuesta a 50, 100 o 300 usuarios activos.

## 4. Free útil y Premium aditivo

No retirar funciones que ya existen, incluidos Personal sin registro, multidivisa, importación/exportación, estadísticas, presupuestos, recurrentes y el Modo Pareja actual. No cobrar por sacar los datos del producto ni convertir un backup previamente gratuito en rescate de pago.

| Área | Mantener disponible | Candidato futuro, sujeto a validación | Ejecución y requisitos |
| --- | --- | --- | --- |
| Personal | Registro, edición, categorías, ciclos, datos locales y backups manuales | Sincronización Personal opcional y versiones de backup automáticas | Backend privado, cuenta opcional, aislamiento por propietario, recuperación y presupuesto de almacenamiento. Nunca migrar datos locales automáticamente. |
| Pareja | Dos miembros, invitaciones, gastos/repartos y compensaciones existentes | Informes compartidos adicionales, previsiones y reglas avanzadas | Primero resolver fiabilidad. Se mantiene el modelo de exactamente dos miembros. Si una licencia beneficia a ambos, definir y autorizar expresamente el alcance por espacio. |
| Estadísticas | Todos los informes gratuitos actuales | Escenarios guardados, comparativas adicionales y exportaciones enriquecidas | Puede calcularse en el dispositivo. Un control local no es una frontera de seguridad infalible frente a quien modifica su propio cliente. |
| Automatizaciones | Reglas actuales y registro consciente | Tareas programadas verificables con historial y límites | Backend persistente, colas/reintentos, coste acotado, autorización y observabilidad. No usar sesiones Work permanentes para sustituir infraestructura. |
| Datos | Formatos actuales y portabilidad | Historial adicional de versiones y restauración remota asistida | Cifrado apropiado, cuota, retención y prueba de recuperación antes de anunciarlo. |

No proponer conexión bancaria como gancho inmediato: aumenta permisos, costes y mantenimiento. Tampoco añadir IA de pago como supuesto requisito de Premium. Una suscripción debe financiar un servicio útil y sostenible, no desbloquear artificialmente la base actual.

## 5. Contrato técnico para futuras licencias

**Diseño preparado para revisión; no es un sistema de facturación desplegado.** No debe aparecer un botón de pago funcional ni una compra ficticia. No hay pasarela, claves de pago, webhooks de cobro ni migración a producción en este documento.

### Modelo de autoridad

- La fuente de verdad de servicios de pago sería una tabla privada de concesiones gestionada por servidor: sujeto, capacidad, origen, estado, inicio, vencimiento, identificador externo único y fecha de verificación.
- Capacidades con nombres estables, por ejemplo `personal_sync`, `automatic_backups`, `advanced_reports`. No representar Premium como un booleano editable en localStorage ni como `user_metadata` modificable por el usuario.
- Una concesión se aplica a un usuario o a un espacio concreto, nunca a una consulta sin ámbito. Para un espacio, el servidor comprueba además sesión viva y membresía activa. Pagar no concede acceso a espacios ajenos ni a los datos personales de la pareja.
- La API de lectura de derechos devuelve solamente las capacidades del solicitante, la fecha de vigencia y su alcance; no devuelve datos de facturación de la pareja.
- Las operaciones de servidor verifican autorización y capacidad en cada solicitud. Un interruptor de interfaz únicamente explica la disponibilidad.
- Ningún permiso Premium altera las políticas RLS de finanzas existentes. Las nuevas tablas expuestas requieren RLS y grants mínimos; preferir tablas administrativas no expuestas para la fuente de verdad. No conceder escrituras de licencias al cliente.

### Flujo de activación posterior

1. Proveedor autorizado confirma una compra en el servidor; un evento del navegador no sirve como comprobante.
2. Verificar firma/autenticidad, estado, producto, entorno y cuenta. Asociar la transacción externa a un único sujeto legítimo mediante una operación idempotente.
3. Persistir la concesión y su auditoría. Procesar renovaciones, reembolsos, cancelaciones y expiraciones sin duplicar permisos ni borrar finanzas.
4. Publicar un endpoint autenticado de derechos. Sus respuestas de usuario no pueden entrar en cachés públicas ni en el service worker de la PWA.
5. Cancelar renovación conserva el acceso hasta la fecha ya pagada, según las condiciones que se aprueben. Una expiración reduce el servicio futuro; conserva lectura/exportación de los datos del usuario.

### Restauración de compras

Restaurar requiere una identidad opcional y comprobación del servidor/proveedor. Al cambiar de dispositivo, consultar las concesiones asociadas a la cuenta y volver a validar el comprobante cuando corresponda. No pedir al usuario que pegue claves privadas ni tokens de otro dispositivo. Los recibos no se envían a PostHog y no se incluyen en backups financieros públicos. Probar idempotencia, cuenta ajena, recibo manipulado, compra reembolsada y expiración. La implementación concreta dependerá del proveedor autorizado y del canal de distribución; no presupone compras nativas de App Store para una PWA.

### Offline y fallos

Los datos Free siguen funcionando localmente aunque falle el servidor de licencias. Una caché de capacidades puede mejorar la experiencia, pero no sustituye comprobaciones de servidor para sincronizar, generar backups remotos o ejecutar automatizaciones. Definir una gracia acotada para prestaciones locales únicamente si es necesaria; una licencia firmada no convierte al navegador del propietario en un entorno imposible de modificar. No guardar claves de firma en el cliente ni fallar de forma abierta concediendo recursos de servidor.

### Pruebas antes de activar dinero

- Usuario A sin concesión no llama servicios de pago aunque modifique el DOM o localStorage.
- Usuario B con concesión no accede a datos/recibos de A ni a su Personal.
- Un antiguo miembro pierde el servicio del espacio aunque conserve un JWT de acceso todavía vigente.
- Una concesión caducada, revocada o reembolsada no autoriza una nueva operación de servidor.
- Eventos duplicados y desordenados no conceden dos licencias ni hacen retroceder un estado verificado más reciente.
- Desconexión, restauración en otro dispositivo y recuperación de cuenta conservan identidad, datos y portabilidad sin duplicar compras.

## 6. SEO: intención antes que volumen inventado

Se revisaron búsquedas en español y páginas originales del sector. La búsqueda de reparto proporcional ya devuelve herramientas específicas, como [Spliple](https://www.spliple.com/dividir-gastos-proporcional-al-sueldo). La privacidad y la ausencia de registro también son propuestas de otros productos: no son una categoría vacía ni una ventaja exclusiva demostrada de Ledger.

No se dispone aquí de Keyword Planner ni de una propiedad Search Console verificada. **No se conocen volúmenes, dificultad SEO, posición de Ledger ni demanda comercial.** La tabla siguiente recoge hipótesis de intención y contenidos que pueden probarse, no palabras clave certificadas como rentables.

| Intención y consultas candidatas | Página propia y respuesta útil | Medida inicial |
| --- | --- | --- |
| «calculadora gastos pareja», «reparto gastos según sueldo», «reparto proporcional alquiler» | `/ledger-app/reparto/`: dos ingresos, gastos comunes, 50/50 y proporcional, fórmula y límites | Aperturas, uso de cálculo y salto voluntario a Ledger; nunca importes como propiedad de eventos. |
| «app gastos sin registro», «control de gastos privado», «app gastos iPhone sin banco» | `/ledger-app/descubre/`: explicar Personal local, PWA e instalación real | Clic a app/demo, activación consentida y retorno. No prometer cifrado extremo a extremo inexistente. |
| «presupuesto de nómina a nómina», «mes financiero empieza al cobrar» | Artículo original con ejemplo ficticio de ciclo 28–27 y enlace a los ciclos de Ledger | Impresiones/clics de la página, visitas a la funcionalidad. |
| «cómo repartir gastos en pareja con sueldos diferentes» | Explicar decisiones de convivencia, diferencias entre quién paga y quién asume el coste, con calculadora | Uso de herramienta y activación Pareja consentida. |
| «copia de seguridad app gastos», «cómo guardar gastos CSV» | Guía breve de exportación y restauración de Ledger con advertencias concretas de almacenamiento local | Exportación completada y pruebas de restauración, sin contenido exportado. |

Implementación recomendada: títulos/description distintos por página, enlaces HTML rastreables, URLs estables con el prefijo de GitHub Pages, canonical correcto, una propuesta clara, imágenes reales con textos alternativos, OG, sitemap y datos estructurados fieles al contenido. No añadir valoraciones, precios, contadores de clientes o logotipos de terceros inventados. Un sitemap no garantiza indexación.

En GitHub Pages de proyecto, un `robots.txt` en `/ledger-app/robots.txt` no equivale al archivo de la raíz del host `https://thepunisher7777.github.io/robots.txt`. No dar por configurada una política global del dominio con ese archivo. Entregar sitemap y enlaces válidos; verificar posteriormente qué configuración del sitio raíz controla el propietario.

Configurar Search Console de forma gratuita solo cuando exista acceso autorizado: verificar la propiedad, enviar el sitemap y revisar páginas, consultas y móvil. Sin esa comprobación, no anunciar «SEO ya está trayendo usuarios». Medir impresiones, clics y CTR junto a la activación; no usar posición media como único resultado.

Fuentes primarias para este método:

- Google, contenido y fundamentos SEO: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google, métricas de rendimiento: https://support.google.com/webmasters/answer/10268906
- Google, informe de consultas/páginas: https://support.google.com/webmasters/answer/7576553
- Google, ubicación obligatoria de robots.txt en la raíz del host: https://developers.google.com/crawling/docs/robots-txt/create-robots-txt
- Ejemplo de competencia directa de intención proporcional: https://www.spliple.com/dividir-gastos-proporcional-al-sueldo

## 7. Experimentos con coste inicial próximo a cero

La meta de 50, luego 100 y 300 activos mensuales medidos es un objetivo de producto. No implica un calendario garantizado ni un número equivalente de clientes de pago. Trabajar por cohortes completas y comparar ventanas con la misma definición y exclusión de pruebas. Las visitas sin consentimiento quedan fuera de los contadores de PostHog y esa limitación debe acompañar las conclusiones.

| Prioridad | Experimento | Hipótesis a comprobar | Señal para continuar o cambiar |
| --- | --- | --- | --- |
| 1 | Calculadora enlazada desde una guía original de reparto | Una utilidad inmediata facilita descubrir Ledger sin registro | Contar inicios de herramienta y pasos a app/demo; si hay uso pero no activación, revisar el siguiente paso antes de producir más contenido. |
| 2 | Onboarding de tres pasos y demo separada | Entender dónde están los datos reduce el abandono inicial | Comparar primera acción útil y retorno de cohortes posteriores; con pocos casos, inspección cualitativa y conteos, no conclusiones de significación. |
| 3 | Guía de ciclos al día de cobro | Una necesidad concreta atrae personas que no se identifican con el mes calendario | Consultas e impresiones de esa página y uso de selector tras consentimiento. |
| 4 | Recomendación voluntaria dentro de Ajustes o al completar una acción | Compartir una herramienta útil trae visitas con intención | Botón comparte URL genérica y texto sin datos privados; medir campañas agrupadas, sin identificadores por persona. |
| 5 | Publicación educativa manual en comunidades que lo permitan | Una explicación con utilidad obtiene feedback accionable | Comentarios y errores reproducibles, además de visitas; parar si las normas no permiten promoción. No duplicar texto en masa. |

Definir el evento y la ventana antes de cada experimento. Mantener un registro con fecha, cambio realizado, población elegible, exclusiones, conteos y decisión. No cambiar varios pasos a la vez cuando la muestra sea pequeña. Un objetivo operativo inicial puede ser revisar semanalmente las nuevas activaciones y los retornos; esa revisión no crea automatizaciones Work ni procesos desatendidos.

Para atribución voluntaria usar etiquetas de campaña públicas y limitadas, por ejemplo `utm_source=organic`, `utm_medium=community`, `utm_campaign=couple_calculator`. No incluir usuario, sueldo, importe, código de invitación, código de recuperación ni nombre de pareja. El analizador debe descartar parámetros desconocidos antes de enviarlos.

## 8. Plan editorial reutilizable de cuatro semanas

Plan pendiente de publicación manual autorizada. No se han creado cuentas, enviado mensajes ni publicado en Reddit, Forocoches u otras comunidades. La frecuencia se puede reducir si mantener el producto requiere más tiempo. Cada pieza usa datos ficticios y un único enlace útil.

| Semana | Pieza principal | Pieza breve 1 | Pieza breve 2 | Comprobación al terminar |
| --- | --- | --- | --- | --- |
| 1 | Guía «50/50 o proporcional: dos maneras de repartir los gastos» enlazada a la calculadora | Vídeo 1, 25–35 s | Imagen comparativa con dos columnas y cantidades ficticias | ¿Se usa la calculadora? ¿El enlace a Ledger se entiende? Registrar dudas reales. |
| 2 | Guía «Tu presupuesto puede empezar el día de cobro» | Vídeo 2, 20–30 s | Captura real de un ciclo 28–27 con etiqueta DEMO | ¿Llegan búsquedas de ese problema? ¿El selector es comprensible? |
| 3 | Guía «Qué compartes y qué conserva privado el Modo Pareja» | Vídeo 3, 25–35 s | Carrusel de tres pasos: identidad, invitación y aceptación | Revisar finalizaciones de invitación y fallos, nunca contenido financiero. |
| 4 | Guía «Tu primera revisión mensual y tu copia de seguridad» | Vídeo 4, 20–30 s | Checklist descargable o texto reutilizable | Revisar retornos, exportaciones y feedback. Elegir un experimento siguiente, no activar Premium por calendario. |

### Guiones de vídeo

**Vídeo 1 — Repartir sin discutir la fórmula.** Pantalla con etiqueta «Ejemplo ficticio». Voz: «Una persona ingresa 2.000 y otra 1.500. Para 1.200 de gastos comunes, al 50/50 serían 600 cada una. Proporcionalmente, aproximadamente 686 y 514. Son dos acuerdos posibles; podéis elegir el que encaje con vuestra situación. La calculadora de Ledger hace la comparación en vuestro navegador». Cierre: «Prueba la herramienta sin introducir tu nombre». No afirmar que un reparto sea universalmente justo.

**Vídeo 2 — El mes empieza cuando cobras.** Voz: «Si cobras el 28, puede tener más sentido revisar del 28 al 27 que del 1 al 31. En Ledger puedes elegir el inicio del ciclo y abrir también los próximos meses para corregir movimientos futuros». Mostrar una captura real de la app con datos demo y el rango de fechas visible. Cierre: «Empieza por registrar un gasto y comprueba el ciclo». No describir el recurrente como domiciliación bancaria.

**Vídeo 3 — Personal y Pareja.** Voz: «Compartir gastos no exige compartir todas tus finanzas. Personal se conserva en tu dispositivo. En Pareja se sincroniza lo que registráis expresamente en vuestro espacio compartido. Cada persona entra con su identidad y acepta una invitación privada». Mostrar pantallas reales, ocultando códigos. Cierre: «Antes de compartir, revisa los campos que van a salir de Personal». No usar «privacidad absoluta» como garantía sin límites.

**Vídeo 4 — Un hábito útil al cerrar el mes.** Voz: «Antes de empezar otro ciclo, revisa los gastos grandes, comprueba tus fijos y exporta una copia. Guardar una app en la pantalla de inicio no sustituye una copia de tus datos. Ledger permite exportar desde Ajustes». Mostrar una exportación de datos ficticios sin enseñar rutas privadas. Cierre: «Guarda tu copia donde puedas recuperarla». No anunciar backup automático inexistente.

### Textos listos para revisar y copiar

**Presentación breve:** «Ledger by ARX es una app web para registrar gastos, revisar presupuestos y organizar finanzas en pareja. Personal funciona sin registro y conserva los datos en el dispositivo. Pareja requiere una identidad y comparte únicamente su espacio. Puedes empezar con la demo o probar la calculadora de reparto. Está en desarrollo; agradecería errores concretos y sugerencias de uso». Añadir el enlace de landing desplegada solo después de verificarlo.

**Publicación de la calculadora:** «¿Repartís los gastos a medias o según lo que ingresa cada persona? He preparado una calculadora que muestra ambas opciones, sin registro. Los cálculos se realizan en el navegador y el enlace de compartir no lleva vuestros ingresos ni importes. La herramienta no decide por vosotros: sirve para comparar y hablar del acuerdo». Añadir el enlace de `/ledger-app/reparto/` cuando esté publicado.

**Actualización de producto:** «He añadido acceso a ciclos futuros en Ledger. Ahora se puede abrir el mes siguiente, corregir un pago adelantado o quitar un duplicado. Si tu ciclo empieza el 28, un pago del 28 de octubre pertenece al ciclo de noviembre. Eliminar ese movimiento conserva la regla recurrente». Acompañar con una captura real de demo, no con movimientos de un usuario.

**Petición de feedback:** «Si pruebas Ledger, me sirve especialmente saber en qué paso te has atascado: primer gasto, selector de mes, copia de seguridad o invitación de Pareja. No publiques contraseñas, códigos ni capturas con datos personales. Con navegador, versión de la app y pasos para reproducir el problema suele bastar». Publicar solo donde esté permitido y cuando lo autorice el propietario.

### Material visual

Capturas propuestas: inicio Personal, edición de movimiento, ciclos futuros, estadísticas y pantalla de invitación con token cubierto. Todas deben salir del código real y mostrar una etiqueta DEMO cuando los datos sean ficticios. Antes de usarlas, revisar móvil 390 px, contraste, texto alternativo, ausencia de importes reales, correos, rutas, identificadores y tokens. Esta investigación no ha capturado pantallas ni inventado imágenes de funciones futuras.

## 9. Costes y puerta de monetización

Trabajo propuesto sin compra de dominios, anuncios, servicios, herramientas SEO ni suscripciones. Hosting estático existente y cálculo local evitan añadir un backend a la calculadora. Costes del backend compartido, sus límites gratuitos, pausa por inactividad y capacidad de recuperación deben verificarse en la auditoría principal; un plan gratuito no implica disponibilidad ni backup gestionado garantizados.

Antes de cualquier cobro: validar seguridad y restauración, describir la prestación real, decidir condiciones y canales, presupuestar proveedor/infraestructura/soporte, y obtener autorización explícita para costes. La posible compatibilidad de una actividad comercial con el empleo del propietario en el CNP y sus obligaciones fiscales requiere revisión por los canales competentes; este documento no emite una conclusión jurídica ni propone ocultar ingresos o actividad.

Orden recomendado: fiabilidad y recuperación → activación medible → retención → herramienta SEO útil → feedback → piloto de una capacidad nueva → decisión de precio. No hay promesa de rentabilidad ni de tiempo hasta alcanzar 50, 100 o 300 activos.
