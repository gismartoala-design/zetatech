const { Prisma } = require("@prisma/client");
const { ZodError } = require("zod");
const { mapearErrorPrisma } = require("./prisma-error-map");

// Centralized error handler for Express
module.exports = function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) return next(err);

  if (err.name === 'MulterError') {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({status:'error',code:err.code,message:err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el tamaño permitido.' : 'No se pudo leer el archivo enviado.'});
  }
  if (['Unexpected end of form','Multipart: Boundary not found'].includes(err.message)) {
    return res.status(400).json({status:'error',code:'INVALID_MULTIPART',message:'La transferencia del archivo llegó incompleta. Selecciónalo nuevamente e intenta subirlo.'});
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { status, ...cuerpo } = mapearErrorPrisma(err.code, err.meta);
    return res.status(status).json({ status: "error", ...cuerpo });
  }

  // Prisma validation/runtime errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      status: "error",
      message: "Validación de datos de Prisma falló",
      details: err.message,
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(500).json({
      status: "error",
      message: "Falló la inicialización de la base de datos",
      details: err.message,
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Datos inválidos",
      details: err.issues,
    });
  }

  // Generic fallback
  const status = err.status || 500;
  return res.status(status).json({
    status: "error",
    message: err.message || "Error interno del servidor",
  });
}
