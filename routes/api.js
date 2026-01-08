const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const shopController = require('../controllers/shopController');

// Category API routes
router.get('/categories', categoryController.apiIndex);
router.get('/categories/:id/attributes', categoryController.getAttributes);

// Product API routes
router.get('/products', productController.apiIndex);
router.get('/products/:id', productController.apiShow);
router.post('/products/batch', productController.apiBatch);

// Order API routes
router.get('/orders/:orderId', shopController.apiGetOrder);

module.exports = router;
