# PayPhone — configuración de la Cajita de Pagos

La integración utiliza Cajita v2, montos calculados por el servidor y confirmación en `/payment-result`. No requiere Id Cliente, clave secreta ni contraseña de codificación de la aplicación: requiere Token y Store ID de la tienda.

## Variables privadas de ejecución

```dotenv
APP_PUBLIC_SITE_URL=https://zettatechtienda.com
PAYPHONE_ENVIRONMENT=live
PAYPHONE_ENABLED=true
PAYPHONE_LIVE_TOKEN=
PAYPHONE_LIVE_STORE_ID=
```

Para pruebas usar `PAYPHONE_ENVIRONMENT=sandbox`, `PAYPHONE_SANDBOX_TOKEN` y `PAYPHONE_SANDBOX_STORE_ID`. No reutilizar el token live en sandbox.

Los `.env` locales de la raíz y API están ignorados por Git y Docker. **No introducir estos valores en variables VITE_, archivos públicos ni código versionado.** El widget de PayPhone recibe su token de integración al preparar una sesión, según el diseño de su SDK; las otras claves de la aplicación no se envían al navegador ni son necesarias para esta integración.

Las variables de ejecución de Cloud Run tienen prioridad sobre los `.env` locales. Un par de credenciales definido en el entorno tiene prioridad sobre el panel, sin mezclar un token de un origen con un Store ID de otro. `PAYPHONE_ENABLED=true` habilita la opción pública solamente cuando ese par está completo. `false` desactiva PayPhone; sin esa variable se respeta la selección del administrador.

## Dónde encontrar el Store ID

En PayPhone Developers: seleccionar la aplicación → Credenciales → botón de listado de tiendas de la fila del RUC → copiar StoreId de la tienda que recibirá los pagos. No usar el RUC, Identificador de aplicación, Id Cliente, clave secreta ni contraseña de codificación como Store ID.

Referencia oficial y captura: https://docs.payphone.app/configuracion-de-ambiente-y-credenciales (sección Token y StoreID).

## Producción con Docker / Cloud Run

La imagen **no incluye los `.env`**. Configurar las variables anteriores en el servicio Cloud Run antes del despliegue y guardar el token mediante Secret Manager. No basta con subir el código o el Dockerfile para actualizar credenciales del servicio remoto.

Dominio autorizado en PayPhone: `https://zettatechtienda.com`. URL de respuesta: `https://zettatechtienda.com/payment-result`. No utilizar `/checkout`.

`GET /api/external/payphone/health` muestra únicamente ambiente, origen de configuración, campos faltantes y presencia de credenciales. No devuelve sus valores ni realiza una transacción. Una respuesta de configuración completa no acredita por sí sola que las credenciales sean válidas o que un cobro haya funcionado.

No preparar cobros ni enviar datos de tarjetas reales para probar este diagnóstico. Prueba automatizada sin proveedor ni base real: `node admin-floreria/api/src/services/payphoneConfig.test.js`.

## Seguridad

Las credenciales compartidas en conversaciones o capturas deben regenerarse antes de utilizarse con clientes. Sustituir el token privado en los entornos locales y Secret Manager al rotarlo; no publicar el nuevo token en el chat. El Store ID pendiente nunca se sustituye por un identificador supuesto.
