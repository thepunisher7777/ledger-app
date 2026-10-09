# Seguridad, aislamiento y contabilidad Pareja

## Fronteras de datos

Personal permanece exclusivamente en su almacenamiento original. No se crea una tabla personal, un endpoint de lectura personal, ni una migración que suba esos datos. No se envían balances, notas, cuentas, IBAN, deudas ni backups personales al configurar/login Pareja.

La única entrada Personal es «Crear copia en Pareja»: construye un borrador con importe, EUR/USD, fecha y categoría. Usa una descripción neutra; omite notas, cuenta e identificador original. El usuario revisa campos, pagador y reparto, y confirma un JSON de lo que se enviará. La copia es independiente; transferencias y movimientos con deuda/repartos personales requieren registro manual.

## Tablas y acceso efectivo

| Tabla | Lectura de cliente | Escritura de cliente |
| --- | --- | --- |
| `ledger_couple_spaces` | Miembro activo del espacio | Solo RPC |
| `ledger_couple_members` | Miembro activo del mismo espacio | Solo RPC |
| `ledger_couple_entities` | Miembro activo del mismo espacio | Solo RPC |
| `ledger_couple_activity` | Miembro activo del mismo espacio | Solo RPC, append-only |
| `ledger_couple_invites` | Ninguna | Solo RPC |
| `ledger_private.operations` | Ninguna | Solo RPC interna |

RLS en todas las tablas públicas compartidas; ningún permiso de tablas a `anon`, ningún permiso directo de escritura a `authenticated`. Las RPC públicas revocan EXECUTE a PUBLIC/anon. Las funciones `SECURITY DEFINER` fijan `search_path=''`, usan objetos cualificados y validan `auth.uid()`/miembro/estado. El esquema privado no se debe exponer por la Data API.

La invitación usa 32 bytes criptográficos aleatorios; solo se persiste SHA-256, caduca en 24 horas, una nueva revoca la anterior y la aceptación consume el token. El enlace no incluye secretos ni se registra en analítica. La interfaz proporciona un código privado. El bloqueo de la fila del espacio y slots únicos 1/2 impiden un tercer miembro o dos aceptaciones simultáneas. Cada identidad tiene como máximo un espacio activo.

Solo los miembros actuales pueden autorizar operaciones. Cambiar un UUID en HTTP no cambia esa autorización. `created_by`/`updated_by` son establecidos por el servidor; el cliente no puede falsificarlos. Importe, cambio, fecha, reparto y referencias a fondos se validan también en SQL. Se rechazan claves fuera de la lista compartida, nulos, sumas inválidas, usuarios ajenos y referencias a cuentas externas.

## Conflictos e idempotencia

Cada registro tiene UUID y versión entera. La RPC aplica exclusivamente la versión esperada, bajo bloqueo transaccional; una versión obsoleta devuelve `40001`. La propuesta se guarda separada del dato del servidor, no se reintenta con una nueva versión automáticamente. La interfaz permite descartarla y volver a editar el dato actual. No hay botón de sobrescritura forzada.

Cada operación tiene UUID único y petición registrada privadamente. Repetir la misma devuelve el resultado previo sin añadir movimientos o auditoría. Reutilizar el UUID con otro autor/cuerpo/espacio se rechaza. El permiso se verifica **antes** de devolver un resultado idempotente, también tras desvinculación.

Límites de protección: 5 espacios nuevos por identidad/día, 10 invitaciones/minuto, 120 operaciones nuevas por identidad/minuto y 10.000 entidades (incluyendo tombstones) por espacio. Una cola que alcance el límite de ritmo permanece pendiente para reintentar, sin crear duplicados. Estos límites no sustituyen supervisión de cuotas del proveedor, pero evitan crecimiento ilimitado desde una sesión de cliente.

Eliminaciones incrementan versión y mantienen tombstone/auditoría. No se permite borrar un fondo referenciado por registros activos. Una regla recurrente no puede registrarse dos veces en el mismo mes.

## Sesiones, caché y desconexión

Solo HTTPS y URL oficial `*.supabase.co`, clave pública publishable o JWT anon. Nunca service-role en cliente. Sesión en memoria por defecto; mantener sesión es opt-in para dispositivo privado. Al habilitarlo, Supabase guarda tokens de sesión en una clave separada por proyecto.

La caché y cola están separadas por proyecto + usuario + espacio. Las peticiones verifican identidad y acceso; un fallo de red no borra cambios pendientes. Cache/lectura/exportación/escritura offline tienen un máximo de 15 minutos desde la última verificación del servidor. La recuperación offline tras recargar requiere haber elegido mantener sesión. No se conserva acceso offline indefinido.

La revocación en servidor es inmediata para consultas y RPC. Un dispositivo desconectado puede conservar lo ya recibido durante esa ventana de caché; **ningún sistema puede borrar a distancia una exportación previa**. Al detectar revocación o cerrar sesión se elimina la caché del espacio y la cola; cerrar sesión con pendientes pide confirmación. Una sesión recordada nunca debe usarse en dispositivo compartido.

Realtime escucha solo tablas compartidas y refresca mediante consultas protegidas por RLS. La revocación puede impedir entregar su propio evento; el refresco visible cada 60 segundos y cada mutación/exportación verificada limita ese caso. No se ejecuta un scheduler de Work. En Personal se desconecta el canal de Pareja.

## Contabilidad

Importes en céntimos enteros; distribución original suma exactamente el importe. Conversión de la primera parte redondeada y segunda por diferencia: suman exactamente el importe base guardado. Se registran tipo, fecha y fuente para reproducibilidad.

Un gasto externo añade adelanto al pagador y responsabilidad a cada miembro. Una aportación añade crédito y saldo al fondo; pagar desde ese fondo reduce el fondo y asigna responsabilidades, sin contar otra aportación ni otro adelanto personal. Los ingresos comunes aumentan el fondo sin atribuir un crédito individual. El crédito aún depositado se distingue de deuda: solo hay compensación entre créditos positivos y negativos opuestos, por el menor valor absoluto. Una compensación pagada reduce esas posiciones sin contarse otra vez como gasto o ingreso.

## Exportación, restauración y cierre

Backups Personal intactos; formato Pareja separado `ledger.couple.v1`, solo entidades del mismo espacio, alias/UUID y auditoría; nunca emails ni datos del otro espacio. Exportar requiere permiso recientemente verificado. Las propuestas pendientes se identifican en `pending_count`.

Restauración Pareja solo en el mismo espacio activo, moneda y dos miembros. Máximo 500 registros/1 MB, vista previa y confirmación; iguales omitidos, versiones actuales como CAS. No resucita tombstones ni reemplaza auditoría histórica. Registros nuevos conservan la autoría del usuario que efectúa la restauración, no metadatos falsificables de un fichero.

Abandonar pide confirmación tras ofrecer exportación. Revoca al saliente, cierra el espacio a escrituras y mantiene al restante lectura/exportación. No se traspasan saldos ni datos a Personal. No existe expulsión unilateral de la pareja ni eliminación de sus datos personales.

Conservación: los registros cerrados y auditoría permanecen hasta petición explícita de eliminación conjunta y actuación administrativa autorizada; no hay purga automática en esta versión. Si ambos salen, ninguna identidad tiene acceso cliente, pero el archivo sigue retenido en servidor. La eliminación de identidad Auth está bloqueada por referencias contables: requiere un procedimiento administrativo de conservación/pseudonimización, nunca cascada unilateral sobre el historial del otro miembro.

## Puerta de publicación

Las pruebas SQL/HTTP local son obligatorias en CI. Antes de producción deben añadirse evidencia de Supabase alojado (JWT, OTP, PostgREST, Realtime, usuarios A/B/C), cierre de sesión/revocación real y Safari/PWA en iPhone. No fusionar por aprobar únicamente DOM/PGlite; no configurar producción con credenciales de pruebas. No habilitar servicios de pago sin autorización.
