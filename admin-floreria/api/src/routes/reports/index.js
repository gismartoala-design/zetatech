const express = require('express');
const router = express.Router();
const reportsController = require('../../controllers/reports/reportsController');

// Obtener datos del reporte
router.get('/data', reportsController.getReportData);

// Generar PDF
router.get('/pdf', reportsController.generateReportPDF);

// Generar Excel
router.get('/excel', reportsController.generateReportExcel);

module.exports = router;
