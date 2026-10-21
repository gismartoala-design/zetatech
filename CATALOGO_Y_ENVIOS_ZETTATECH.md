# Catálogo y envíos

## Categorías y subcategorías

En Administrador → Productos → Nuevo producto / Editar aparecen dos selectores: categoría principal y subcategoría opcional. Ambos permiten crear y seleccionar sin salir del formulario. Ejemplo: Computadoras › Laptops.

La ruta jerárquica se guarda en el campo `category` existente. Las categorías planas actuales siguen funcionando y no requieren migraciones SQL. No se reasignan automáticamente productos ni se crean categorías reales durante las pruebas.

La tienda muestra un árbol con enlaces independientes. Una categoría principal incluye sus subcategorías; el enlace de una subcategoría muestra solo sus productos. Solo las categorías con productos publicados aparecen en la tienda.

## Antes y ahora

Portada, carrusel, tarjetas y ficha usan el precio final calculado por el API y el precio anterior de la oferta activa. El precio anterior se presenta tachado y con la etiqueta Antes; el nuevo, con Ahora y el porcentaje calculado. Sin rebaja real se muestra únicamente Precio. Los descuentos se siguen gestionando mediante el sistema de ofertas existente; no se inventa un precio anterior.

## Entrega

Guayaquil: envío gratis y entrega en 24 horas. El aviso se muestra en portada, productos y carrito. El checkout selecciona Guayaquil por defecto y el servidor impone costo $0 para esta ciudad, independientemente del monto de envío enviado por el navegador.

Samborondón, Daule y Durán no heredan automáticamente esa gratuidad: necesitan un sector con tarifa configurada. Sin cobertura se indica contactar a ventas y se impide continuar el pago. La ciudad queda incluida en la dirección del pedido. Las cotizaciones de clientes antiguos que no envían ciudad conservan el cálculo por sector previo.

## Verificación

- `npm run check`
- `npm run test:commerce` (datos simulados, sin escrituras en la base real)
- `cd admin-floreria/api && npm test`
- Compilar web y administrador antes del despliegue habitual con Dockerfile.
