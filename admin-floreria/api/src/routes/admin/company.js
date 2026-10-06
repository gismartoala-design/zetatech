const express = require('express');
const {
  generateApiKey,
  generateWebhookSecret,
  updateAllowedDomains,
  getApiConfig,
  getApiLogs,
  getPaymentSettings,
  updatePaymentSettings,
  testPaypalSettings,
} = require('../../controllers/admin/apiConfigController');

const router = express.Router();

// Generar nueva API Key
router.post('/api-key', generateApiKey);

// Generar nuevo Webhook Secret
router.post('/webhook-secret', generateWebhookSecret);

// Actualizar dominios permitidos
router.put('/allowed-domains', updateAllowedDomains);

// Configuración de pagos del admin autenticado
router.get('/payment-settings', getPaymentSettings);
router.put('/payment-settings', updatePaymentSettings);
router.post('/payment-settings/test-paypal', testPaypalSettings);

// Obtener configuración actual
router.get('/:companyId/api-config', getApiConfig);

// Obtener logs de API requests
router.get('/:companyId/api-logs', getApiLogs);

module.exports = router;
