# ZettaTech: experiencia visual conectada

Estado: propuesta de diseño y desarrollo; no implementada ni publicada.

## Referencias revisadas

- [Bang & Olufsen: concepto de landing](https://www.pinterest.com/pin/612208143096207902/). La secuencia presenta un audífono como protagonista, ondas de sonido, un cambio a fotografía de uso y una vista de componentes separados con llamadas a características. Conserva fondo oscuro, posición visual dominante y tipografía consistente entre escenas.
- [Kamui: inspiración de diseño interactivo](https://www.pinterest.com/pin/575123814918763338/). La secuencia pasa de paisaje ilustrado a personaje y cartas; cambia planos y profundidad, muestra un giro de carta y mantiene el mismo universo cromático y gráfico. El pin enlaza a https://youtu.be/DdISHpWxXu0.

Se revisaron secuencias de fotogramas de los videos incluidos en ambos pines. Son demostraciones visuales: no permiten confirmar por sí solas la implementación, rendimiento, comportamiento móvil ni si cada transición se activa con scroll o reproducción automática. No se propone copiar sus ilustraciones, fotografías ni identidad.

## Dirección propuesta: «Tu mundo, conectado»

Conservar el logo original y el verde aprobado. Usar negro grafito, verde profundo y superficies claras de catálogo. El verde luminoso del símbolo funciona como acento, no como fondo de toda la tienda.

Hilo conductor: un trazo o aro de energía inspirado en el símbolo de ZettaTech acompaña a un producto real protagonista. La misma iluminación, curvas de movimiento y jerarquía tipográfica conectan portada, características, categorías y catálogo.

No sumar una nueva mascota ni una introducción que obligue a esperar. Revisar la introducción con mascota que existe actualmente para integrarla a la dirección aprobada o sustituirla por una entrada breve del logo sin bloquear la compra.

## Recorrido de la portada

| Escena | Contenido | Conexión y movimiento propuesto |
| --- | --- | --- |
| 1. Descubre | Logo, mensaje corto, producto real y botón visible | Entrada breve; luz verde detrás del producto y desplazamiento suave de capas. Acceso inmediato a tienda. |
| 2. Acércate | Dos o tres beneficios verificables del mismo producto | El producto conserva continuidad, cambia escala y posición; el trazo conecta cada beneficio. Máximo una escena breve fijada durante el scroll en escritorio. |
| 3. Elige tu mundo | Audio, wearables y accesorios | El aro se convierte visualmente en marco de las categorías. Cada tarjeta muestra fotografía real y enlaza al catálogo filtrado. |
| 4. Compra | Productos reales, stock, ofertas y precio anterior | La composición se abre hacia una cuadrícula clara. Animación discreta; comprar no exige recorrer una presentación. |
| 5. Confía | Marcas comercializadas, soporte y condiciones reales | Logos con tamaño óptico uniforme y carrusel pausado por interacción. Sin marcas ficticias ni promesas no configuradas. |
| 6. Continúa | Soporte de ventas y pie de página | El trazo cierra la composición y se recupera el símbolo de marca. |

En fichas de producto: títulos contenidos, descripción breve, especificaciones plegables, zoom de fotografía bajo control del usuario y precio/stock/botón siempre fáciles de localizar. Carrito y pago priorizan claridad, sin transiciones largas ni scroll fijado.

## Recursos que vamos a producir

1. Tablero visual y storyboard de seis escenas, con versión móvil.
2. Fondos, halos y texturas originales de ZettaTech; el aro/trazo se construye preferentemente en SVG/CSS para mantener nitidez y bajo peso.
3. Fotografías recortadas de productos reales, con sombras consistentes y versiones optimizadas para escritorio y móvil.
4. Composiciones promocionales basadas en esas fotografías. Los recursos generados no deben cambiar puertos, botones, forma, logos ni prestaciones de un producto vendido.
5. Kit de movimiento: entradas, cambios de escala, transiciones entre escenas, tarjetas, botones y estados de carga.

Una separación de componentes como la referencia de audífonos necesita fotografías por piezas, renders o un modelo 3D correcto. No puede obtenerse fielmente de una sola foto: para la primera versión se propone acercamiento y cambio de encuadre, sin inventar el interior del producto.

## Administrador: escenas editables, no animaciones aisladas

Reutilizar el CMS existente, ampliándolo con bloques de escena y plantillas. No instalar WordPress ni reemplazar el backend.

- Seleccionar producto vinculado al catálogo: nombre, precio, stock y oferta se toman de su registro, no se duplican en textos decorativos.
- Editar mensajes, imágenes por dispositivo, puntos focales, fondos y botones.
- Elegir una transición predefinida: suave, acercamiento, desplazamiento o continuidad de producto.
- Configurar intensidad, duración, continuidad entre escenas y versión móvil dentro de límites seguros.
- Mantener controles de contenido, diseño y movimiento separados; lienzo amplio, paneles plegables y vista previa a pantalla completa.
- Modo de edición estable sin movimiento y modo de reproducción para revisar la secuencia completa.
- Conservar borrador, vista previa, publicación e historial; solo administradores autorizados pueden cambiar el sitio.

## Plan por entregas

### 1. Dirección y materiales

Elegir un producto real protagonista del inventario y preparar storyboard, textos breves y lista de recursos disponibles/faltantes. Definir una sola dirección visual coherente con la marca actual.

Criterio de salida: composición aprobada para escritorio y móvil; recursos identificados y prestaciones comerciales comprobadas.

### 2. Prototipo vertical de tres escenas

Construir portada → detalle del producto → categorías. Usar el producto real y acceso funcional al catálogo. Revisar continuidad al avanzar y retroceder, altura de navegación y comportamiento táctil antes de extender el diseño.

Criterio de salida: las tres escenas se sienten parte del mismo recorrido; no se bloquea el scroll ni el acceso a comprar; móvil tiene una composición propia.

### 3. Integración con el editor

Ampliar el documento compartido, validación del API y controles del CMS para las nuevas escenas. Mantener lectura de documentos actuales y reversión a versiones anteriores. La vista previa debe utilizar el mismo renderizador que la tienda publicada.

Criterio de salida: un administrador puede cambiar producto, imágenes, textos y transición, previsualizar y publicar sin editar código. Las rutas públicas no pueden guardar cambios.

### 4. Extensión de la experiencia comercial

Aplicar el lenguaje visual al catálogo, ficha, marcas y soporte. Mantener categorías, descuentos, inventario, métodos de pago y configuración actuales. No incorporar escenas decorativas a cada paso del checkout.

Criterio de salida: los datos comerciales coinciden entre producto, portada, catálogo y carrito; editar el CMS no sustituye ni altera inventario o pagos.

### 5. Rendimiento, accesibilidad y despliegue

Verificar escritorio y móvil reales, navegación por teclado, reducción de movimiento, fallback sin efectos, carga progresiva de recursos y pruebas de compra con métodos de prueba. Medir rendimiento antes/después, priorizando que no empeore la rapidez de acceso al catálogo.

Objetivos de aceptación: contenido visible sin esperar animaciones; ningún desplazamiento horizontal accidental; movimiento reducido sin zoom/parallax; errores de imágenes con reemplazo seguro; animaciones sin fugas ni saltos al cambiar de ruta; pruebas de tienda, /admin y /api dentro del Dockerfile actual antes de desplegar una nueva revisión.

## Encaje técnico confirmado en el proyecto

- `shared/website.ts` ya define bloques, entrada fade/zoom/slide, duración y zoom. Falta una noción de escenas conectadas y movimiento coordinado con scroll.
- `shared/SiteRenderer.tsx` es el lugar compartido para renderizado público y vista previa. Incorporar ahí las escenas reutilizables, no dos implementaciones distintas.
- El editor de `admin-floreria/client/src/features/modules/cms/pages/CmsHomeDashboard.tsx` ya ofrece dispositivos y pantalla completa; ampliar su organización y propiedades.
- El proyecto ya incluye Framer Motion. Comenzar con las herramientas existentes y CSS/SVG; evaluar 3D u otra dependencia solo si el prototipo demuestra que lo necesita.
- No cambiar credenciales, datos de productos, configuración de pagos ni base de datos para elaborar esta propuesta. Una eventual migración solo se determina al diseñar el almacenamiento definitivo de las escenas.

Primera entrega recomendada: un prototipo de tres escenas, no el rediseño simultáneo de toda la tienda. Permite validar el hilo conductor y después convertirlo en una plantilla editable.
