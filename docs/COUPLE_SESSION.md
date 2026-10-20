# Sesión persistente de Pareja — 20 octubre 2026

La conexión de fábrica mantiene la sesión en dispositivos privados. El formulario de acceso, registro y recuperación ofrece una casilla para desactivarlo en un dispositivo compartido. Se conserva una configuración personalizada que ya hubiera desactivado la persistencia.

Se guarda la sesión mediante el SDK oficial de Supabase y localStorage, con clave por proyecto. El SDK renueva sus tokens: no se guardan contraseñas ni códigos secretos de recuperación y no se amplía artificialmente la vigencia de JWT. RLS y la comprobación de sesión viva del servidor siguen protegiendo los datos compartidos.

`ledger.workspace.v1` recuerda Personal/Pareja; no contiene datos financieros ni credenciales. Si se seleccionó Personal se respeta al abrir otra vez. Al volver a Pareja, a la app desde segundo plano o a tener conexión, se restaura la sesión y se verifica el acceso. La renovación no convierte la caché financiera en autorización permanente: sigue vigente su límite de verificación de 15 minutos.

La configuración de conexión ya no invoca un cierre de sesión asíncrono que podía revocar una sesión recién restaurada. El cierre explícito conserva su revocación y limpieza de caché compartida. No se suben datos Personales.

## Verificación

- `npm test`: regresiones contables, multidivisa/XML, permisos RLS, invitaciones, recuperación y aislamiento de espacios.
- `node scripts/couple-session.test.cjs`: interfaz real Ledger en JSDOM y SDK oficial fijado a 2.117.3, con respuestas Auth ficticias. Comprueba acceso persistente, reapertura, renovación de token expirado, última selección Personal, cierre explícito y opción sin persistencia.
- `python scripts/smoke_check.py`: contrato de publicación y PWA.

La simulación DOM no demuestra comportamiento de Safari físico. En iPhone, Safari y la app instalada pueden tener almacenes separados. Borrar los datos del navegador, usar modo privado, retirar permisos, recuperar la cuenta o cerrar sesión requieren volver a entrar. Las sesiones no pueden garantizarse si el sistema elimina el almacenamiento del dispositivo.

Referencia oficial: https://supabase.com/docs/guides/auth/sessions

La recuperación administrativa de una identidad autorizada se ejecuta por separado. No se incluyen secretos, nombres de cuentas reales ni datos financieros en este documento o en el repositorio.
