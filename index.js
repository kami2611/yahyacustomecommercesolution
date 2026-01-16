require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => console.error('✗ MongoDB connection error:', err));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Make session available in all views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  // Store the originally requested URL
  req.session.returnTo = req.originalUrl;
  res.redirect('/admin/login');
};

// Admin Login routes (before auth middleware)
app.get('/admin/login', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/admin');
  }
  res.render('admin/login', { 
    title: 'Admin Login',
    error: null 
  });
});

app.post('/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username === adminUsername && password === adminPassword) {
    req.session.isAuthenticated = true;
    const returnTo = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } else {
    res.render('admin/login', { 
      title: 'Admin Login',
      error: 'Invalid username or password' 
    });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/admin/login');
  });
});

// SEO Admin Login routes (separate auth from main admin)
const seoLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.'
});

app.get('/admin/seo-login', (req, res) => {
  if (req.session.isSeoAuthenticated) {
    return res.redirect('/admin/seo-panel');
  }
  res.render('admin/seo/login', {
    title: 'SEO Admin Login',
    error: null,
    layout: false
  });
});

app.post('/admin/seo-login', seoLoginLimiter, (req, res) => {
  const { username, password } = req.body;
  const seoUsername = process.env.SEO_ADMIN_USERNAME || 'seoadmin';
  const seoPassword = process.env.SEO_ADMIN_PASSWORD || 'seo123';
  
  if (username === seoUsername && password === seoPassword) {
    req.session.isSeoAuthenticated = true;
    const returnTo = req.session.seoReturnTo || '/admin/seo-panel';
    delete req.session.seoReturnTo;
    res.redirect(returnTo);
  } else {
    res.render('admin/seo/login', {
      title: 'SEO Admin Login',
      error: 'Invalid username or password',
      layout: false
    });
  }
});

app.get('/admin/seo-panel/logout', (req, res) => {
  req.session.isSeoAuthenticated = false;
  res.redirect('/admin/seo-login');
});

// Import Routes
const shopRoutes = require('./routes/shop');
const apiRoutes = require('./routes/api');
const adminCategoryRoutes = require('./routes/admin/categories');
const adminProductRoutes = require('./routes/admin/products');
const adminBrandRoutes = require('./routes/admin/brands');
const adminHomepageRoutes = require('./routes/admin/homepage');
const adminAnnouncementRoutes = require('./routes/admin/announcements');
const adminOrderRoutes = require('./routes/admin/orders');
const adminNewsletterRoutes = require('./routes/admin/newsletters');
const adminSeoRoutes = require('./routes/admin/seo');

// SEO Middleware
const { redirectIfSeoAuthenticated } = require('./middleware/seoAuth');
const seoController = require('./controllers/seoController');

// Use Routes - Admin routes must come before shop routes
// because shop routes have catch-all patterns that would intercept admin URLs
app.use('/api', apiRoutes);

// Apply auth middleware to all admin routes
app.use('/admin/categories', requireAuth, adminCategoryRoutes);
app.use('/admin/products', requireAuth, adminProductRoutes);
app.use('/admin/brands', requireAuth, adminBrandRoutes);
app.use('/admin/homepage', requireAuth, adminHomepageRoutes);
app.use('/admin/announcements', requireAuth, adminAnnouncementRoutes);
app.use('/admin/orders', requireAuth, adminOrderRoutes);
app.use('/admin/newsletters', requireAuth, adminNewsletterRoutes);

// SEO Admin Panel routes (uses separate auth)
const { requireSeoAuth } = require('./middleware/seoAuth');
app.use('/admin/seo-panel', requireSeoAuth, adminSeoRoutes);

// Admin Dashboard
app.get('/admin', requireAuth, (req, res) => {
  res.redirect('/admin/homepage');
});

// Shop routes - mounted last because they have catch-all patterns
app.use('/', shopRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// Start the server
app.listen(port, () => {
  console.log(`✓ Server is running at http://localhost:${port}`);
  console.log(`  - Shop: http://localhost:${port}`);
  console.log(`  - Admin: http://localhost:${port}/admin`);
});