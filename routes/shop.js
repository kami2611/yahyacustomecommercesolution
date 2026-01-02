const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Shop routes
router.get('/', shopController.home);
router.get('/shop', shopController.index);
router.get('/search', shopController.search);
router.get('/cart', shopController.cart);
router.get('/product/:slug', shopController.show);
router.get('/category/:slug', shopController.category);

// Newsletter
router.post('/newsletter/subscribe', shopController.newsletterSubscribe);

module.exports = router;
