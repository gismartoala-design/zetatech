const express = require("express");

const uploadController = require("../../controllers/upload/indexController");

const router = express.Router();
router.get('/status', (_req,res)=>{
  const {provider,configured,missing,invalid}=require('../../services/storageConfig').storageConfiguration();
  res.set('Cache-Control','private, no-store');
  res.json({status:'success',data:{provider,configured,missing,invalid}});
});

const multer = require("multer");

// Usar memoryStorage en lugar de diskStorage para no escribir en disco.
// El archivo queda en memoria (req.file.buffer) hasta subirlo al proveedor configurado.
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB máximo (para videos)
  }
});

// Endpoint para subir archivos
router.post("/", upload.single("file"), uploadController.uploadFile);

module.exports = router;
