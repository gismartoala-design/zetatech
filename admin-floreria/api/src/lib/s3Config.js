const Minio = require("minio");
const { requireStorageConfiguration } = require('../services/storageConfig');

// Loaded only for MinIO operations; SFTP and Cloudinary do not initialize it.
const {config} = requireStorageConfiguration();
const minioClient = new Minio.Client({
  endPoint: config.endpoint,
  port: config.port,
  useSSL: config.useSSL,
  accessKey: config.accessKey,
  secretKey: config.secretKey,
});

module.exports = minioClient;
