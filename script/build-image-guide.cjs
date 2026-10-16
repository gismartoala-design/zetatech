const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('../admin-floreria/api/node_modules/pdfkit');
const target = path.resolve(__dirname,'../client/public/guias/ZettaTech-guia-de-imagenes.pdf');
fs.mkdirSync(path.dirname(target),{recursive:true});
const doc = new PDFDocument({size:'A4',margin:42,bufferPages:true,info:{Title:'ZettaTech | Guía de imágenes para la tienda',Author:'ZettaTech',Subject:'Dimensiones recomendadas, formatos y preparación de imágenes'}});
const stream = fs.createWriteStream(target);
doc.pipe(stream);
const ink='#14251C',green='#15743F',gray='#52605A',light='#EFF5F1';
function header(section) {
  doc.rect(0,0,595.28,118).fill('#09150F');
  doc.image(path.resolve(__dirname,'../client/public/brand/zettatech-logo.png'),36,7,{width:255});
  doc.font('Helvetica').fontSize(9).fillColor('#C5D7CD').text('GUÍA DE IMÁGENES / TIENDA ONLINE',320,43,{width:225,align:'right'});
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#59F461').text(section,320,64,{width:225,align:'right'});
}
function title(text,y){doc.font('Helvetica-Bold').fontSize(22).fillColor(ink).text(text,42,y,{width:510});}
function body(text,y){doc.font('Helvetica').fontSize(10.5).fillColor(gray).text(text,42,y,{width:510,lineGap:4});}
header('01 / MEDIDAS RECOMENDADAS');
title('Imágenes nítidas en cada pantalla',140);
body('Todas las medidas están en píxeles (ancho × alto). Son tamaños de exportación recomendados para el diseño actual; la web adapta las imágenes al espacio disponible.',177);
const rows=[
 ['Foto principal de producto','1600 × 1600','1:1','WebP / JPG / PNG'],
 ['Galería de producto','1600 × 1600','1:1','Misma proporción'],
 ['Carrusel de productos de inicio','1600 × 1600','1:1','Usa la foto del producto'],
 ['Portada / hero en escritorio','2560 × 1440','16:9','WebP / JPG'],
 ['Portada / hero en móvil','1080 × 1440','3:4','Archivo móvil separado'],
 ['Bloque imagen + texto','1600 × 1600','1:1','WebP / JPG'],
 ['Galería o categorías visuales','1200 × 1200','1:1','WebP / JPG'],
 ['Banner panorámico*','2400 × 800','3:1','Ver nota de recorte'],
 ['Logos del carrusel de marcas','600 × 240','5:2','PNG transparente'],
 ['Logo horizontal del negocio','1200 × 300','4:1 aprox.','PNG transparente'],
 ['Icono de marca / favicon','512 × 512','1:1','Símbolo sin texto'],
 ['Imagen al compartir un enlace','1200 × 630','1.90:1','JPG / PNG'],
];
const col=[42,253,349,410];
doc.roundedRect(42,235,511,28,4).fill(green);
['Ubicación','Exportación','Relación','Formato / uso'].forEach((t,i)=>doc.font('Helvetica-Bold').fontSize(9).fillColor('white').text(t,col[i]+7,244,{width:i===0?198:i===1?88:i===2?55:135}));
rows.forEach((r,n)=>{const y=263+n*31;if(n%2===0)doc.rect(42,y,511,31).fill(light);r.forEach((t,i)=>doc.font(i===0?'Helvetica-Bold':'Helvetica').fontSize(8.5).fillColor(ink).text(t,col[i]+7,y+10,{width:i===0?198:i===1?88:i===2?55:135}));});
body('* Un banner panorámico no debe subirse en un bloque cuadrado: se recortaría. La portada usa su propio recorte adaptable. Las imágenes del carrusel se muestran completas; el espacio visual del carrusel es aproximadamente 1:1.05, aunque el archivo recomendado es cuadrado.',655);
body('No amplíes una imagen pequeña para alcanzar estas medidas: no recupera detalle. Parte del archivo original de mayor calidad. El logo suministrado se conserva como imagen de mapa de bits; el contenedor SVG no lo convierte en un logo vectorial.',725);

doc.addPage(); header('02 / ENCUADRE Y CALIDAD');
title('Cómo preparar cada archivo',140);
const tips=[
 ['Productos y carrusel','Usa fotos cuadradas, con el objeto completo y un margen libre del 10–15% alrededor. Mantén iluminación y fondo consistentes. No incluyas precios, descuentos, textos o botones en la imagen: esos datos vienen del administrador.'],
 ['Portada de escritorio y móvil','En escritorio, sitúa el producto hacia la derecha y deja el lado izquierdo libre para el título. En móvil prepara otra composición centrada. Los fondos usan recorte de cobertura: evita detalles importantes pegados a los bordes.'],
 ['Logo y marcas','Usa fondo transparente y recorta los márgenes vacíos grandes. No estires el símbolo ni cambies la relación original. El nombre ZettaTech y sus letras claras necesitan un fondo oscuro para mantener contraste. Para favicon utiliza solo el símbolo.'],
 ['Peso y formato','Objetivos orientativos: productos 150–450 KB, portada 300–800 KB, logos 30–150 KB. Exporta fotografías como WebP/JPG con calidad 80–90 y perfil sRGB. Usa PNG cuando necesites transparencia. El editor acepta JPG, PNG y WebP hasta 5 MB por imagen.'],
 ['Zoom y nitidez','Para una imagen mostrada a 700 px con zoom 1.10× en una pantalla 2×, busca al menos 1540 px de ancho de origen. Regla práctica: ancho visible × densidad de pantalla × zoom. Los píxeles importan; cambiar solo el valor DPI no mejora la web.'],
];
tips.forEach(([heading,text],i)=>{const y=198+i*111;doc.roundedRect(42,y,511,98,7).fill(i%2? '#FFFFFF':light);doc.font('Helvetica-Bold').fontSize(12).fillColor(green).text(heading,55,y+13,{width:480});doc.font('Helvetica').fontSize(10).fillColor(gray).text(text,55,y+35,{width:482,lineGap:3});});

doc.addPage(); header('03 / CARGA DESDE EL ADMINISTRADOR');
title('Dónde colocar cada imagen',140);
const steps=[
 ['1. Fotografías reales del catálogo','Administrador / Productos / Crear o editar producto. Carga la foto principal y las adicionales disponibles; completa precio, categoría y stock. Déjalo activo para que pueda aparecer en la tienda.'],
 ['2. Carrusel de la portada','Personalizar Sitio Web / Principal / bloque Productos. La fotografía viene del catálogo real; no hace falta subirla otra vez. Elige selección automática o productos concretos, categoría, cantidad y destacados.'],
 ['3. Portada y bloques visuales','Personalizar Sitio Web / selecciona el bloque Portada o Imagen. Carga la imagen de escritorio y, en Portada, la imagen móvil alternativa. Usa Biblioteca para reutilizar archivos.'],
 ['4. Identidad y marcas','En Apariencia y navegación puedes sustituir el logo y el favicon. En el bloque Marcas, cada elemento tiene su propia imagen y enlace. Usa logos autorizados de los fabricantes; no fotografías de productos.'],
 ['5. Guardar, revisar y publicar','Guarda el borrador. Revisa escritorio, tablet y móvil; después publica la versión. Comprueba que los textos sean legibles, no haya recortes del producto y la foto abra nítida en su ficha.'],
];
steps.forEach(([heading,text],i)=>{const y=200+i*105;doc.font('Helvetica-Bold').fontSize(12).fillColor(green).text(heading,42,y,{width:510});doc.font('Helvetica').fontSize(10.5).fillColor(gray).text(text,42,y+25,{width:510,lineGap:4});});
doc.roundedRect(42,732,511,39,5).fill(light);doc.font('Helvetica-Bold').fontSize(10).fillColor(ink).text('Nombres sugeridos: jbl-audifonos-azules-01.webp · portada-movil.webp',55,746,{width:485});
const pages=doc.bufferedPageRange();
for(let i=0;i<pages.count;i++){doc.switchToPage(i);doc.font('Helvetica').fontSize(8).fillColor(gray).text(`ZettaTech | Guía de imágenes · ${i+1} / ${pages.count}`,42,785,{width:510,align:'right'});}
doc.end();
stream.on('finish',()=>console.log(target));
