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

La imagen principal incluye la tienda, el panel administrativo y la API.
Su comando de inicio arranca primero la API en localhost y luego la web en
`PORT` (8080 por defecto). Si algún proceso falla, termina el contenedor para
que Cloud Run lo reinicie.

Para probar la imagen completa localmente:

```bash
docker build -t zetatech .
docker run --env-file admin-floreria/api/.env -e PORT=8080 -p 5000:8080 zetatech
```

Para producción, configurar `DATABASE_URL` y `JWT_SECRET` en el entorno de
Cloud Run. El `.env` local no se incluye en el build. `ADMIN_EMAIL` y
`ADMIN_PASSWORD` son necesarios si se usa la creación de administrador por
entorno; no cambian una contraseña de un usuario existente.

En Cloud Run, la URL pública queda así:

```text
https://tu-servicio.run.app/       # tienda
https://tu-servicio.run.app/admin/ # panel
```

El backend también puede seguir siendo un servicio separado: configurar
`EMBEDDED_API=false` y su URL en `BACKEND_URL`. Docker Compose usa este modo
para mantener el volumen de imágenes del API. En ambos modos, el navegador
usa `/api/*` en el mismo dominio de la tienda.

Si `/api/admin/login` y `/api/health` devuelven `fetch failed`, la web no está
alcanzando la API. Desplegar el Dockerfile actualizado con `EMBEDDED_API=true`
y las variables de base/sesión evita depender de un backend externo inexistente.

El manifest `cloud-run.yaml` es una plantilla: sustituir la imagen y la URL
pública, y crear los secretos `db-secret` / `jwt-secret` o adaptar sus nombres.

Para actualizar el servicio existente desde código, conservando sus variables:

```bash
gcloud auth login
gcloud run deploy zetatech --project=useful-aquifer-476119-t1 --region=europe-west1 --source=. --port=8080 --memory=1Gi --update-env-vars=EMBEDDED_API=true
```

Antes de desplegar, comprobar que ese servicio tenga `DATABASE_URL` y
`JWT_SECRET` configurados. Este comando no copia el `.env` ni crea secretos.

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
