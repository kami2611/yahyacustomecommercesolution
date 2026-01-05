const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const seoController = require('../../controllers/seoController');
const { requireSeoAuth, redirectIfSeoAuthenticated } = require('../../middleware/seoAuth');

// Rate limiter for SEO login attempts
const seoLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Login routes (no auth required)
router.get('/login', redirectIfSeoAuthenticated, seoController.loginPage);
router.post('/login', seoLoginLimiter, seoController.login);
router.get('/logout', seoController.logout);

// Dashboard and management routes (auth required)
router.get('/', requireSeoAuth, seoController.dashboard);
router.get('/edit/:slug', requireSeoAuth, seoController.editPage);
router.post('/edit/:slug', requireSeoAuth, seoController.updatePage);

// API routes
router.get('/api/:slug', requireSeoAuth, seoController.getPageSeoApi);

module.exports = router;
