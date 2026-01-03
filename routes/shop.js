const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Shop routes
router.get('/', shopController.home);
router.get('/shop', shopController.index);
router.get('/search', shopController.search);
router.get('/cart', shopController.cart);
router.get('/checkout', shopController.checkout);
router.post('/checkout/place-order', shopController.placeOrder);
router.get('/offers/:type', shopController.offers);

// Product routes - support both simple and SEO-friendly URLs
router.get('/product/:slug', shopController.show);

// Category routes - support nested path structure for SEO-friendly URLs
// Handles: /category/electronics, /category/electronics/phones, etc.
router.get('/category/:slug', shopController.category);
router.get('/category/:parent/:slug', shopController.category);
router.get('/category/:grandparent/:parent/:slug', shopController.category);

// SEO-friendly product URLs with full category path
// Handles: /electronics/phones/iphone-pro-max
router.get('/:cat1/:productSlug', shopController.showByPath);
router.get('/:cat1/:cat2/:productSlug', shopController.showByPath);
router.get('/:cat1/:cat2/:cat3/:productSlug', shopController.showByPath);

// Newsletter
router.post('/newsletter/subscribe', shopController.newsletterSubscribe);

module.exports = router;
