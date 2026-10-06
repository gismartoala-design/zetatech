const fs = require("fs");
const { uploadBuffer } = require("../../services/storageService");

function sanitizeFileName(originalName = "") {
  return originalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "No se encontro archivo",
      });
    }

    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      return res.status(400).json({
        status: "error",
        message: "Solo se permiten imagenes o videos",
      });
    }

    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({
        status: "error",
        message: `El archivo es demasiado grande (maximo ${isVideo ? "50MB" : "5MB"})`,
      });
    }

    const folderName = isVideo ? "videos" : "images";
    const safeName = sanitizeFileName(file.originalname || "archivo");
    const objectName = `${folderName}/${Date.now()}-${safeName}`;

    const uploadedFile = await uploadBuffer({
      objectName,
      buffer: file.buffer,
      contentType: file.mimetype,
    });

    return res.status(200).json({
      status: "success",
      url: uploadedFile.url,
      public_id: uploadedFile.objectName,
      resource_type: isVideo ? "video" : "image",
      message: isVideo
        ? "Video subido exitosamente"
        : "Imagen subida exitosamente",
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      status: "error",
      message: error.message || "Error interno del servidor",
    });
  }
};
