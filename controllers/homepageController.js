const Product = require('../models/Product');
const Category = require('../models/Category');

// Homepage sections management page
exports.homepage = async (req, res) => {
  try {
    // Get products grouped by section
    const carouselProducts = await Product.find({ 
      carouselImage: { $exists: true, $ne: '' }
    }).select('name slug carouselImage');
    
    const newOffers = await Product.find({ isNewOffer: true })
      .populate('category', 'name')
      .select('name slug price originalPrice');
    
    const bestOffers = await Product.find({ isBestOffer: true })
      .populate('category', 'name')
      .select('name slug price originalPrice');
    
    const featuredProducts = await Product.find({ isFeatured: true })
      .populate('category', 'name')
      .select('name slug price originalPrice');
    
    // Get all products for adding to sections
    const allProducts = await Product.find({ isActive: true })
      .populate('category', 'name')
      .sort('name')
      .select('name slug price category');
    
    res.render('admin/homepage/index', {
      title: 'Homepage Sections',
      carouselProducts,
      newOffers,
      bestOffers,
      featuredProducts,
      allProducts
    });
  } catch (error) {
    console.error('Error loading homepage admin:', error);
    res.status(500).render('error', { message: 'Error loading homepage admin' });
  }
};

// Add product to carousel
exports.addToCarousel = async (req, res) => {
  try {
    const { productId, carouselImage } = req.body;
    await Product.findByIdAndUpdate(productId, { carouselImage });
    res.redirect('/admin/homepage');
  } catch (error) {
    console.error('Error adding to carousel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove from carousel
exports.removeFromCarousel = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { carouselImage: '' });
    res.redirect('/admin/homepage');
  } catch (error) {
    console.error('Error removing from carousel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle section membership
exports.toggleSection = async (req, res) => {
  try {
    const { productId, section, action } = req.body;
    const updateField = {};
    
    if (section === 'newOffers') {
      updateField.isNewOffer = action === 'add';
    } else if (section === 'bestOffers') {
      updateField.isBestOffer = action === 'add';
    } else if (section === 'featured') {
      updateField.isFeatured = action === 'add';
    }
    
    await Product.findByIdAndUpdate(productId, updateField);
    res.redirect('/admin/homepage');
  } catch (error) {
    console.error('Error toggling section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove from section
exports.removeFromSection = async (req, res) => {
  try {
    const { section } = req.body;
    const updateField = {};
    
    if (section === 'newOffers') {
      updateField.isNewOffer = false;
    } else if (section === 'bestOffers') {
      updateField.isBestOffer = false;
    } else if (section === 'featured') {
      updateField.isFeatured = false;
    }
    
    await Product.findByIdAndUpdate(req.params.id, updateField);
    res.redirect('/admin/homepage');
  } catch (error) {
    console.error('Error removing from section:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
