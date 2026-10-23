# Privacidad de LEDGER by ARX

Ledger es una PWA local-first. En Personal, los movimientos, importes, cuentas, saldos, presupuestos, objetivos, notas y deudas se guardan localmente en el dispositivo salvo que el usuario exporte una copia manualmente.

## Analítica opcional

La analítica de la beta es opt-in. Solo se activa tras consentimiento explícito y puede desactivarse desde Ajustes.

Proveedor: PostHog EU Cloud.

Controles:
- autocapture desactivado
- pageviews automáticos desactivados
- grabación de sesión desactivada
- heatmaps desactivados
- captura de consola desactivada
- captura de rendimiento desactivada
- perfiles personales desactivados
- sin nombre ni email enviados por Ledger
- allowlist de propiedades técnicas/producto

Eventos permitidos: sesiones, versión, plataforma, pantallas, uso de funciones, instalación y errores técnicos.

Nunca deben enviarse a analítica importes, movimientos, categorías financieras, notas, nombres de cuentas, saldos, presupuestos, deudas, archivos importados/exportados ni texto libre del usuario.

La clave local histórica `flowfi.public.v27` se conserva únicamente por compatibilidad de datos durante la migración FlowFi → Ledger.


## Idioma de la interfaz

La preferencia de idioma se guarda localmente en `ledger.ui.language.v1`. Cambiar el idioma no traduce ni modifica movimientos, notas, cuentas, importes, presupuestos, deudas ni archivos de copia de seguridad.

## Tipos de cambio (Beta 1.5.0)

Las cuentas EUR/USD, sus importes y el último tipo guardado permanecen en el estado local. La actualización automática consulta exclusivamente `EUR/USD` al proveedor BCE de Frankfurter (`https://api.frankfurter.dev/v2/providers/ecb/rate/EUR/USD`), sin credenciales, sin referencia de la página y sin enviar importes, nombres de cuenta, movimientos ni archivos. El proveedor recibe la conexión de red. Puede desactivarse desde Ajustes y sustituirse por un cambio manual. Sin conexión se conserva el último tipo válido y se muestra su fecha.

Portfolio Performance XML se analiza en el dispositivo como vista previa. No se sube a ningún servidor ni reemplaza los datos. Personal no exige login. Pareja es una sincronización opcional separada del modo local.
# Modo Pareja — vista previa opcional

Personal conserva su almacenamiento y backups existentes sin login ni subida automática. Pareja requiere identidad propia y un proyecto Supabase configurado conscientemente. Solo se envían entidades creadas expresamente en ese espacio o una copia personal revisada y confirmada. No se envían automáticamente notas, cuentas, IBAN ni identificadores de movimientos personales.

Pareja almacena en servidor datos compartidos, UUID de miembros y autor/editor, alias e historial. Supabase Auth trata el correo para verificar identidad, pero la API de Ledger compartida no devuelve emails ni finanzas personales. Exportación/restauración usan un formato Pareja separado. No se añaden datos financieros a la analítica existente.

Configuración pública: `ledger.couple.config.v1`; caché y cola por proyecto/usuario/espacio `ledger.couple.cache.v1:*`; puntero de caché `ledger.couple.last.v1:*`. Comprobantes locales para evitar copiar dos veces: `ledger.couple.copy-receipts.v1`, sin subir identificadores originales. Sesión en memoria salvo elección de mantenerla, que almacena tokens Auth en `ledger.couple.auth.v1:<proyecto>`. Caché bloqueada después de 15 minutos sin verificar; logout o revocación detectada elimina esa caché. Archivos ya exportados no pueden revocarse a distancia.

Abandonar cierra escrituras y revoca al saliente; el restante conserva lectura/exportación del archivo compartido. No se transfieren ni borran datos personales. Historial cerrado permanece hasta un procedimiento autorizado de eliminación conjunta, sin purga automática. [Políticas completas](docs/COUPLE_SECURITY.md).

## Identidad Pareja sin correo

El servidor del espacio Pareja almacena el nombre de usuario, identificador Auth y hash de un código aleatorio de recuperación. Supabase Auth procesa la contraseña. No se requiere dirección de correo real para este flujo; `ledger-users.invalid` es un identificador técnico. Los límites de alta/recuperación conservan temporalmente un hash de IP y contadores durante una hora. El código original no se guarda en Ledger ni se incorpora a backups. Al recuperar se revocan sesiones y rota el código; las finanzas Personal no se envían a este endpoint.

## Instrumentación 1.6.1

Solo tras consentimiento, `ledger_milestone` registra primera apertura **medida**, cambio de moneda base, primera transacción/presupuesto guardado tras activar medición y el evento de instalación `appinstalled` cuando el navegador lo proporciona. No reconstruye actividad previa al consentimiento. Safari iOS no ofrece este último evento; abrir en modo standalone no acredita fecha de instalación. El antiguo `ledger_install` era primera medición del navegador, no una instalación verificada.

Las claves `ledger.analytics.milestone.v1.*` son marcadores booleanos de hitos, independientes del contenido financiero. Los identificadores PostHog son anónimos por navegador: no son la identidad de Supabase ni permiten contar personas entre dispositivos. Valores y eventos tienen lista permitida; se omiten URLs, propiedades de perfil, textos libres y geolocalización. La retirada del consentimiento bloquea también el envío de eventos encolados al llegar a `before_send`. No elimina retrospectivamente eventos que el servidor ya hubiera recibido.

La demo no lee ni escribe almacenamiento personal. La calculadora no guarda sus entradas y comparte solo su enlace público. La guía usa únicamente `ledger.onboarding.v1` para recordar su cierre. No se añaden cookies publicitarias ni grabaciones de sesión.
