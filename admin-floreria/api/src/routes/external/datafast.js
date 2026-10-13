const express = require('express');
const { db } = require('../../lib/prisma');
const { datafastConfig, createDatafastCheckout, confirmDatafastPayment } = require('../../services/datafastService');
const router = express.Router();
router.use((_req,res,next) => { res.set('Cache-Control','no-store'); next(); });
router.get('/health', async (_req,res) => {
  try {
    const company = await db.company.findFirst({ where: { isActive: true, ...(process.env.STOREFRONT_COMPANY_ID ? { id: process.env.STOREFRONT_COMPANY_ID } : {}) } });
    const config = datafastConfig(company?.settings?.paymentSettings);
    res.status(config.ready ? 200 : 503).json({ status: config.ready ? 'success' : 'error', data: { environment: config.environment, configured: config.ready }, message: config.ready ? 'Datafast disponible' : 'Datafast pendiente de configuración' });
  } catch { res.status(503).json({ status: 'error', message: 'Datafast no está disponible.' }); }
});
router.post('/checkout', async (req,res) => {
  try { res.json({ status: 'success', data: await createDatafastCheckout(db, { ...req.body, customerIp: req.get('X-Forwarded-For')?.split(',')[0].trim() || req.ip }) }); }
  catch(error) { res.status(error.statusCode || 502).json({ status: 'error', message: error.statusCode ? error.message : 'No se pudo iniciar Datafast.' }); }
});
router.post('/confirm', async (req,res) => {
  try { res.json({ status: 'success', data: await confirmDatafastPayment(db, req.body.resourcePath) }); }
  catch(error) { res.status(error.statusCode || 502).json({ status: 'error', message: error.statusCode ? error.message : 'No se pudo verificar Datafast.' }); }
});
module.exports = router;
