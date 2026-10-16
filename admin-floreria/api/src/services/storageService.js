const path = require("path");
const SftpClient = require("ssh2-sftp-client");
const streamifier = require("streamifier");
const { cloudinary, isCloudinaryConfigured } = require("../lib/cloudinary");
const { requireStorageConfiguration } = require('./storageConfig');

function getStorageType() {
  return String(process.env.STORAGE_TYPE || "minio").trim().toLowerCase();
}

function trimSlashes(value = "") {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function normalizePublicBaseUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/g, "");
}

function encodePublicPath(objectName) {
  return String(objectName || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getMinioConfig() {
  const bucketName = process.env.MINIO_BUCKET || "zetatech";
  const publicBaseUrl = normalizePublicBaseUrl(process.env.MINIO_PUBLIC_URL);

  return { bucketName, publicBaseUrl };
}

async function ensureMinioBucket(bucketName) {
  const minioClient = require('../lib/s3Config');
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName, "us-east-1");
  }
}

async function uploadToMinio({ objectName, buffer, contentType }) {
  const minioClient = require('../lib/s3Config');
  const { bucketName, publicBaseUrl } = getMinioConfig();

  await ensureMinioBucket(bucketName);
  await minioClient.putObject(bucketName, objectName, buffer, buffer.length, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  return {
    url: `${publicBaseUrl}/${encodePublicPath(objectName)}`,
    objectName,
    storageType: "minio",
  };
}

async function uploadToSftp({ objectName, buffer }) {
  const {config} = requireStorageConfiguration();

  if (
    !config.host ||
    !config.username ||
    !config.password ||
    !config.remotePath ||
    !config.publicBaseUrl
  ) {
    throw new Error("Configuracion SFTP incompleta");
  }

  const sftp = new SftpClient();
  const normalizedObjectName = trimSlashes(objectName);
  const remoteFilePath = `${config.remotePath}/${normalizedObjectName}`;
  const remoteDir = path.posix.dirname(remoteFilePath);

  try {
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      readyTimeout: 15000,
      retries: 1,
    });
    await sftp.mkdir(remoteDir, true);
    await sftp.put(buffer, remoteFilePath);
  } finally {
    await sftp.end().catch(() => undefined);
  }

  return {
    url: `${config.publicBaseUrl}/${encodePublicPath(normalizedObjectName)}`,
    objectName: normalizedObjectName,
    storageType: "sftp",
  };
}

async function uploadToCloudinary({ objectName, buffer, contentType }) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Configuracion Cloudinary incompleta");
  }

  const normalizedObjectName = trimSlashes(objectName);
  const parsedObjectName = path.posix.parse(normalizedObjectName);
  const folder = trimSlashes(parsedObjectName.dir);
  const publicId = parsedObjectName.name || `upload-${Date.now()}`;

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder || undefined,
        public_id: publicId,
        resource_type: "auto",
        overwrite: false,
        unique_filename: false,
        filename_override: parsedObjectName.base || undefined,
        invalidate: true,
      },
      (error, uploadResult) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(uploadResult);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

  return {
    url: result.secure_url || result.url,
    objectName: result.public_id,
    storageType: "cloudinary",
    contentType,
  };
}

async function uploadBuffer({ objectName, buffer, contentType }) {
  requireStorageConfiguration();
  const storageType = getStorageType();

  if (storageType === "cloudinary") {
    return uploadToCloudinary({ objectName, buffer, contentType });
  }

  if (storageType === "sftp") {
    return uploadToSftp({ objectName, buffer, contentType });
  }

  if (storageType !== "minio") {
    throw new Error(`Proveedor de almacenamiento no soportado: ${storageType}`);
  }

  return uploadToMinio({ objectName, buffer, contentType });
}

module.exports = {
  uploadBuffer,
};
