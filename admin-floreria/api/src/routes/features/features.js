const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/meController');
const authMiddleware = require('../../middlewares/authMiddleware');

router.get('/get-features', authMiddleware, adminController.features);

module.exports = router;
