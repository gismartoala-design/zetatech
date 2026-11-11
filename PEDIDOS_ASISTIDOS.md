# Pedidos con atención de ventas

El checkout ofrece **Coordinar entrega y pago con ventas** junto a los métodos online existentes. El cliente completa sus datos de contacto y entrega, selecciona esta opción y pulsa **Generar pedido**. No se inicia ninguna pasarela ni se cobra una tarjeta.

El servidor recalcula precios, stock y envío con el catálogo real. Registra el pedido como `PENDING`, con la forma de coordinación en las notas. No se añade una tabla ni se requiere una migración.

La confirmación muestra el número del pedido, agradece la compra, indica que ventas contactará al celular registrado y permite descargar un comprobante PDF. El documento incluye productos, cantidades, precios, total, saldo pendiente y datos de entrega/contacto. Es un comprobante del pedido, no una factura ni una guía de transporte.

El mismo PDF se adjunta a los correos del comprador y de ventas. El destinatario comercial se toma de **Administrador → Pagos → Email del responsable**; si está vacío se conserva la configuración `OWNER_NOTIFICATION_EMAIL` / `SALES_NOTIFICATION_EMAIL`. Los envíos se esperan antes de responder, evitando depender de tareas en segundo plano después de cerrar una petición en Cloud Run.

Si falla SMTP, el pedido no se elimina ni se vuelve a crear. La respuesta indica qué envío fue aceptado por SMTP y la pantalla informa al comprador si su correo falló, conservando la descarga del PDF. Aceptación por SMTP no garantiza llegada a la bandeja de entrada. No se agregaron reintentos automáticos de correo.

Los comprobantes se generan en memoria y se devuelven únicamente al cliente que crea el pedido; no se suben a carpetas públicas ni se habilita una ruta pública para consultar pedidos por número.

## Control desde el administrador

La nueva opción aparece activada para tiendas existentes que tienen métodos habilitados. Una lista vacía sigue deshabilitando todo el checkout. En **Pagos**, puede desmarcarse la opción y guardar para desactivarla; se respeta esa decisión en el servidor. Los pagos online conservan sus pasarelas y su validación de pago.

## Verificación

- `npm run check` y compilaciones de tienda y administrador.
- Prueba aislada: `cd admin-floreria/api && node src/routes/external/assisted-orders.test.js`.
- La prueba usa base de datos y SMTP simulados, valida el PDF, ambos destinatarios, el estado pendiente, los importes recalculados y un fallo de correo. No crea pedidos reales ni envía correos reales.
- Comprobantes PDF revisados con un pedido corto y un carrito de 60 artículos.
- Recorrido comprobado en Chrome a 1440 y 390 px con API simulada: datos, selección de ventas sin horario obligatorio, generación, agradecimiento, carrito vacío y descarga del PDF.

Para habilitarlo en producción hay que desplegar los cambios con las variables SMTP existentes. No se modificaron datos de producción ni se verificó la entrega real de correo en este trabajo.
