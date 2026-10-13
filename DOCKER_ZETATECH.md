# Zetatech con Docker

El archivo `.env` real no se copia a las imágenes. El API lo recibe mediante
`admin-floreria/api/.env` en tiempo de ejecución.

## Crear o actualizar el administrador

```bash
cd admin-floreria/api
npm run admin:create
```

El comando usa `DATABASE_URL`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`,
guarda la contraseña con bcrypt y no la imprime.

## Levantar servicios

Desde la raíz del proyecto:

```bash
# Solo tienda pública
npm run docker:web

# Solo panel administrador (incluye el API)
npm run docker:admin

# Tienda + panel + API
npm run docker:all
```

URLs locales:

- Tienda: http://localhost:5000
- Administrador: http://localhost:5173
- API: http://localhost:4001
- Admin en la misma URL de la tienda: http://localhost:5000/admin/

Para detener los contenedores:

```bash
npm run docker:down
```

Las imágenes del admin incluyen `shared/`, que es donde vive el editor visual
Zetatech. El volumen `zetatech-uploads` conserva las imágenes subidas.

La imagen principal también incluye el panel administrativo bajo `/admin/`.
En Cloud Run, la URL pública queda así:

```text
https://tu-servicio.run.app/       # tienda
https://tu-servicio.run.app/admin/ # panel
```

El backend puede seguir siendo un servicio Cloud Run interno separado. Define
su URL en `BACKEND_URL`; el servidor principal reenvía `/api/*`, por lo que el
panel mantiene la misma URL y no necesita una URL de API distinta.

## Producción

Antes de publicar, configura en `admin-floreria/api/.env` el dominio real de
`CORS_ORIGIN`, un `JWT_SECRET` largo y una contraseña de administrador distinta
de cualquier valor de ejemplo. Para el build del panel, usa las variables del
archivo `deploy.env.example`:

```bash
docker compose --env-file deploy.env --profile all up -d --build
```

El `.env` del API está excluido de la imagen y solo se inyecta al contenedor en
runtime. No uses `admin123` ni `localhost` en un despliegue público.
