# Editor de la portada Zetatech

## Acceso

En el admin: **Personalizar Sitio Web → Principal** (`/app/cms/home`). Solo usuarios activos con rol `ADMIN` y empresa activa pueden abrir, guardar o publicar. La API vuelve a consultar los permisos en cada solicitud y obtiene la empresa desde la sesión; no acepta un `companyId` enviado por el navegador.

## Uso

1. Ajustar apariencia, marca, colores, fuente, logo, favicon, menú y pie.
2. Añadir bloques de portada, texto, imagen, beneficios, productos, galería, preguntas o contacto.
3. Arrastrar o usar flechas para ordenar. Duplicar, ocultar o eliminar; deshacer/rehacer mientras el editor está abierto.
4. Subir JPG, PNG o WebP de hasta 5 MB; elegir imágenes de la biblioteca para cada bloque, incluyendo alternativa móvil.
5. Ajustar alineación, espacio, duración, zoom y animación de entrada.
6. Revisar en escritorio, tablet y móvil. Los enlaces de la vista previa no navegan.
7. **Guardar borrador** no altera la tienda. **Publicar** convierte el documento actual en público. Recuperar una versión anterior genera un borrador que requiere publicación explícita.

La biblioteca incluye copias locales de las dos fotos proporcionadas. No se inventaron modelos, precios ni stock. Los widgets de productos consultan el catálogo de la empresa. No se modificaron sus registros.

## Persistencia y despliegue

Se utiliza el campo JSON existente `Company.settings.websiteEditor`; no se necesita migración. Almacena borrador, documento publicado, revisión y las últimas diez publicaciones anteriores. Los cambios simultáneos devuelven HTTP 409 para evitar pérdidas.

- Admin: `/api/cms/website`, `/products`, `/media`, y POST `/save`, `/publish`, `/restore`.
- Público: GET `/api/external/website` y `/api/external/website/products`.
- La respuesta pública de empresa excluye `websiteEditor`; los borradores nunca se publican allí.
- Configurar `CORS_ORIGIN` con el origen exacto del admin en instalaciones con dominios distintos. Las escrituras requieren origen válido, sesión y cabecera `X-Site-Editor: 1`.
- `STOREFRONT_COMPANY_ID` permite fijar la empresa de esta tienda en el backend. Si no existe, se resuelve un dominio registrado; solo una instalación con una única empresa activa admite ese fallback. Una instalación ambigua devuelve 404.
- Reiniciar/desplegar API, admin y tienda para habilitar las nuevas rutas. La tienda consulta la versión publicada al cargar, recuperar el foco y cada 30 segundos. SSR precarga la publicación.
- Las subidas utilizan el almacenamiento ya configurado; cada objeto nuevo queda bajo `sites/<empresa>/`.

El constructor por bloques cubre la portada. La fuente, colores base, navegación y favicon publicados se comparten con la tienda. Las plantillas internas de producto, checkout y pagos conservan su lógica; sus formularios completos todavía no son widgets arrastrables. El catálogo, inventario y pagos continúan en sus módulos correspondientes.

## Validación local sin base de datos

```
node --import tsx --test script/site-editor.test.ts
npm run check
npm run build
npm --prefix admin-floreria/client run build
```

Las pruebas inyectan una base simulada en memoria; no importan Prisma ni cargan `.env`. Cubren roles, empresa, origen, enlaces inválidos, borradores privados, publicación, historial y conflictos. Compilar tampoco inicia la API ni escribe registros.

La prueba opcional `node script/smoke-site-editor.mjs` usa Chrome y datos simulados, con servidor efímero en loopback. No inicia servicios del negocio ni carga `.env`.

En este entorno Chrome canceló la navegación local con `net::ERR_ABORTED` antes de cargar la aplicación; por ello esa comprobación visual queda pendiente. Las pruebas de lógica y permisos y las compilaciones se verifican independientemente.
