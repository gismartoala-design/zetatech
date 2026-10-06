const express = require('express');
const router = express.Router();
const ordersController = require('../../controllers/orders/indexController');

// Obtener todas las órdenes
router.get('/', ordersController.getAllOrders);

// Crear una orden
router.post('/', ordersController.createOrder);

// Actualización masiva de estado
router.patch('/bulk-update', ordersController.bulkUpdateStatus);

module.exports = router;
