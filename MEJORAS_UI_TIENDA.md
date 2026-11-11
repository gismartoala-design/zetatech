# Mejoras de la tienda: puntos 1 a 4

Cambios de presentación pública; no se escribe contenido, inventario ni configuración en la base de datos.

## Portada e imágenes

- La portada ya no selecciona automáticamente el primer producto del catálogo.
- Utiliza la imagen del bloque **Portada** del editor. La antigua imagen predeterminada tiene como sustituto visual fijo el recorte transparente de la laptop ASUS disponible en los recursos del proyecto.
- La imagen para móvil sigue respetando el campo del editor. Un `productIds[0]` explícito en el bloque puede fijar un producto real; no se añadió una nueva interfaz administrativa para ello.
- El video de entrada se conserva una vez por sesión, con botón para omitirlo y respeto de movimiento reducido.
- Se reutilizan los recortes transparentes existentes para portada, categorías, editoriales predeterminados y las fotografías de catálogo que tienen un recorte correspondiente. Las fotografías originales de productos nuevos se mantienen en paneles claros uniformes: no se elimina automáticamente su fondo ni se sustituye el artículo por otro.
- Una fotografía modificada desde el administrador nunca hereda el recorte de un producto distinto.

## Diseño y distribución

- Portada con su transición original al desplazarse, categorías, productos, editoriales y marcas. Los bloques personalizados de texto, galería y contacto conservan sus posiciones.
- La reordenación es de presentación: el documento guardado y la interfaz del editor no se modifican.
- Categorías predeterminadas derivadas del inventario real; los elementos personalizados del bloque conservan sus imágenes, enlaces y textos.
- Cuadrícula de productos reales que respeta selección, filtros y límite del bloque del administrador. Ofertas, precios anteriores y stock conservan su origen real.
- Tipografía, espacios, botones, estados de foco, fotos y tarjetas compartidos en la tienda.
- Carrusel de marcas con pausa, pausa al enfocar o pasar el cursor, y alternativa sin movimiento. Usa logos cargados en el administrador; si falta uno o falla, muestra su nombre sin inventar un logo.

## Navegación

- Se restauró la cabecera verde original, con sus enlaces y carrito y su transición a una barra flotante redondeada al desplazarse. La nueva cabecera de dos filas no se utiliza.
- Enlaces principales tomados del tema publicado.
- Buscar: `/shop?q=texto`. Ofertas reales: `/shop?ofertas=1`.
- Las categorías y subcategorías siguen disponibles en el catálogo.
- Búsquedas y ofertas se precargan con su consulta correcta en el servidor; el enrutador recibe la búsqueda separada de la ruta para mantener el renderizado inicial coherente.

## Verificación

- `npm run check`.
- `node --import tsx script/storefront-scenes.test.tsx`.
- `npm run test:commerce`.
- Compilación de tienda/servidor y compilación del administrador, por compatibilidad del renderizador compartido.
- Revisión visual y funcional en Chrome con catálogo simulado y sin base de datos: 320, 390, 768 y 1440 px, menú, Escape, categorías, búsqueda, ofertas, resultados vacíos y pausa de marcas.
- La misma revisión se completó con HTML renderizado en el servidor e hidratación del cliente, sin excepciones JavaScript. Las capturas de revisión están en `/tmp/zeta-ui-*.png` y usan productos ficticios exclusivamente en el servidor temporal de pruebas.

Los puntos 5 y 6 del plan (rediseño específico de detalle/carrito/checkout y trabajo completo de transiciones) quedan para la siguiente etapa. Estos cambios requieren desplegar una nueva versión para verse en producción.

La revisión visual descrita arriba corresponde a la primera propuesta. Posteriormente se restauraron el navbar y la transición de portada a petición del usuario; se conservaron el recorte fijo y las mejoras de las demás secciones.
