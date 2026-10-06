const express = require('express');
const { db: prisma } = require('../../lib/prisma');

const router = express.Router();

/**
 * GET /api/external/reviews
 * Obtener reseñas activas de la empresa DIFIORI.
 */
router.get('/', async (req, res) => {
  try {
    const company = await prisma.company.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!company) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    
    const reviews = await prisma.review.findMany({
      where: { 
        companyId: company.id,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return res.status(200).json({ status: 'success', data: reviews });
  } catch (error) {
    console.error('External reviews error:', error);
    // Si la tabla aún no existe en el cliente generado, devolvemos array vacío para no romper la web
    return res.status(200).json({ status: 'success', data: [] });
  }
});

/**
 * POST /api/external/reviews
 * Enviar una nueva reseña desde la web.
 */
router.post('/', async (req, res) => {
  try {
    const { name, content, stars, role } = req.body;

    if (!name || !content || !stars) {
      return res.status(400).json({ status: 'error', message: 'Datos incompletos' });
    }

    const numericStars = Number.parseInt(String(stars), 10);
    if (!Number.isInteger(numericStars) || numericStars < 1 || numericStars > 5) {
      return res.status(400).json({ status: 'error', message: 'La calificación debe estar entre 1 y 5' });
    }

    const company = await prisma.company.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!company) {
      return res.status(404).json({ status: 'error', message: 'Empresa no configurada' });
    }

    const newReview = await prisma.review.create({
      data: {
        name: String(name).trim(),
        content: String(content).trim(),
        stars: numericStars,
        role: role || "Cliente",
        companyId: company.id,
        isActive: true // Por ahora las activamos por defecto
      }
    });

    return res.status(201).json({ status: 'success', data: newReview });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ status: 'error', message: 'Error al guardar la reseña' });
  }
});

module.exports = router;
