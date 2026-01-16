const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

// Render admin brand list page
exports.index = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ displayOrder: 1, name: 1 });
    
    // Get product count for each brand
    const brandsWithCount = await Promise.all(brands.map(async (brand) => {
      const productCount = await Product.countDocuments({ brand: brand._id, isActive: true });
      return {
        ...brand.toObject(),
        productCount
      };
    }));
    
    res.render('admin/brands/index', { 
      title: 'Brands',
      brands: brandsWithCount
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).render('error', { message: 'Error fetching brands' });
  }
};

// Render create brand form
exports.create = async (req, res) => {
  try {
    res.render('admin/brands/create', { 
      title: 'Create Brand',
      brand: null
    });
  } catch (error) {
    console.error('Error loading create form:', error);
    res.status(500).render('error', { message: 'Error loading form' });
  }
};

// Handle brand creation
exports.store = async (req, res) => {
  try {
    const { name, slug, description, displayOrder, isActive } = req.body;
    
    // Handle file upload for background image
    const backgroundImage = req.file ? req.file.path : '';
    
    const brand = new Brand({
      name,
      slug: slug || undefined,
      description,
      backgroundImage,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActive === 'true' || isActive === true
    });
    
    await brand.save();
    res.redirect('/admin/brands');
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(400).render('admin/brands/create', {
      title: 'Create Brand',
      brand: req.body,
      error: error.message
    });
  }
};

// Render edit brand form
exports.edit = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).render('error', { message: 'Brand not found' });
    }
    
    res.render('admin/brands/edit', { 
      title: 'Edit Brand',
      brand
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).render('error', { message: 'Error loading form' });
  }
};

// Handle brand update
exports.update = async (req, res) => {
  try {
    const { name, slug, description, displayOrder, isActive } = req.body;
    
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).render('error', { message: 'Brand not found' });
    }
    
    // Handle new background image upload
    let backgroundImage = brand.backgroundImage;
    if (req.file) {
      // Delete old image if exists
      if (brand.backgroundImage) {
        const publicId = getPublicIdFromUrl(brand.backgroundImage);
        if (publicId) {
          await deleteImage(publicId);
        }
      }
      backgroundImage = req.file.path;
    }
    
    brand.name = name;
    brand.slug = slug || brand.slug;
    brand.description = description;
    brand.backgroundImage = backgroundImage;
    brand.displayOrder = parseInt(displayOrder) || 0;
    brand.isActive = isActive === 'true' || isActive === true;
    
    await brand.save();
    res.redirect('/admin/brands');
  } catch (error) {
    console.error('Error updating brand:', error);
    const brand = await Brand.findById(req.params.id);
    res.status(400).render('admin/brands/edit', {
      title: 'Edit Brand',
      brand: { ...brand?.toObject(), ...req.body },
      error: error.message
    });
  }
};

// Handle brand deletion
exports.destroy = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }
    
    // Delete background image if exists
    if (brand.backgroundImage) {
      const publicId = getPublicIdFromUrl(brand.backgroundImage);
      if (publicId) {
        await deleteImage(publicId);
      }
    }
    
    // Remove brand reference from all products
    await Product.updateMany({ brand: brand._id }, { $unset: { brand: 1 } });
    
    await Brand.findByIdAndDelete(req.params.id);
    res.redirect('/admin/brands');
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).render('error', { message: 'Error deleting brand' });
  }
};

// Get all brands for API (used in product forms)
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Error fetching brands' });
  }
};
