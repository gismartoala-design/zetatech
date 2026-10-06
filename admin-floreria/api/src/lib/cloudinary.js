const cloudinary = require("cloudinary").v2;

function getCloudinaryConfig() {
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
}

function isCloudinaryConfigured() {
  const config = getCloudinaryConfig();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
}

cloudinary.config(getCloudinaryConfig());

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
};
