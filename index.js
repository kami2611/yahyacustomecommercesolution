const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Import Routes
const shopRoutes = require('./routes/shop');
const apiRoutes = require('./routes/api');
const adminCategoryRoutes = require('./routes/admin/categories');
const adminProductRoutes = require('./routes/admin/products');
const adminHomepageRoutes = require('./routes/admin/homepage');
const adminAnnouncementRoutes = require('./routes/admin/announcements');

// Use Routes - Admin routes must come before shop routes
// because shop routes have catch-all patterns that would intercept admin URLs
app.use('/api', apiRoutes);
app.use('/admin/categories', adminCategoryRoutes);
app.use('/admin/products', adminProductRoutes);
app.use('/admin/homepage', adminHomepageRoutes);
app.use('/admin/announcements', adminAnnouncementRoutes);

// Admin Dashboard
app.get('/admin', (req, res) => {
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