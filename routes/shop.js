const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Shop routes
router.get('/', shopController.index);
router.get('/product/:slug', shopController.show);
router.get('/category/:slug', shopController.category);

module.exports = router;
