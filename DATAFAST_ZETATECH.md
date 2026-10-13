# Pagos y confirmación

La tienda ofrece Datafast (en lugar de PayPhone), contra entrega, transferencia y PayPal/Zelle. Las devoluciones de pagos PayPhone anteriores siguen funcionando.

## Datafast

Configurar en Admin > Pagos: ambiente, Entity ID, access token, MID, TID, PSERV, nombre de riesgo y tasa incluida en los precios. El token se guarda únicamente en el backend y no aparece en la información pública de la tienda.

Alternativamente usar las variables `DATAFAST_*` de `admin-floreria/api/.env.example`. No están configuradas por este cambio.

La integración usa la guía oficial: https://developers.datafast.com.ec/index.aspx

Se crea una sesión en el servidor con precios y stock consultados en la base. El widget recibe solo el checkout ID. El retorno consulta el resultado directamente a Datafast y contrasta moneda, total y número de pedido antes de marcarlo pagado. Los códigos de pruebas no se aceptan en producción. Consultar nuevamente el retorno no genera una segunda confirmación del mismo pedido.

Antes de activar cobros reales:

- Completar las credenciales de Datafast y las pruebas/certificación del comercio.
- Confirmar el desglose tributario: la implementación actual aplica una sola tasa incluida en todo el total; no admite un carrito con tasas mezcladas.
- Configurar costos de envío por sector desde el admin.
- Los cupones con Datafast permanecen bloqueados; el cliente puede usar otro método o retirar el cupón.
- Verificar el envío de correo con SMTP y una compra autorizada de pruebas. Las pruebas automáticas no usan la base real ni envían correos.
- Configurar con Datafast la notificación y conciliación de pagos si el comprador cierra la ventana antes del retorno. Actualmente se comprueba al retornar y se puede repetir esa consulta.

## Contra entrega

El pedido se guarda con `cashOnDelivery=true` y estado de pago pendiente. No se descuenta una reserva fija de $7. El comprador puede imprimir la guía del pedido o guardarla como PDF desde el navegador; este comprobante no es una guía de transporte de Servientrega.

La pantalla de confirmación y el correo distinguen un pago aprobado de un pedido pendiente de pago. El correo del comprador es obligatorio para recibir la confirmación. Un fallo de SMTP no revierte un pedido ni un pago aprobado.
