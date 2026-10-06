const Minio = require("minio");

// Las credenciales de MinIO deben venir del entorno. Antes estaban escritas
// aquí en texto plano (host, access key y secret key reales): ese valor quedó
// expuesto en el repositorio y debe rotarse en el servidor MinIO cuanto antes.
// Sin las variables de entorno, el cliente queda configurado pero inservible
// (en vez de tumbar el proceso completo al arrancar) y las subidas fallarán
// con un error claro hasta que se configuren.
const requiredEnv = ["MINIO_ENDPOINT", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
  console.warn(
    `[s3Config] Faltan variables de entorno para MinIO: ${missingEnv.join(", ")}. Las subidas de archivos fallarán hasta que se configuren en el .env del servidor.`,
  );
}

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "unconfigured",
  secretKey: process.env.MINIO_SECRET_KEY || "unconfigured",
});

module.exports = minioClient;
