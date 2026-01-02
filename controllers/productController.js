const Product = require('../models/Product');
const Category = require('../models/Category');

// Render admin product list page
exports.index = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .sort('-createdAt');
    
    res.render('admin/products/index', { 
      title: 'Products',
      products 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).render('error', { message: 'Error fetching products' });
  }
};

// Render create product form
exports.create = async (req, res) => {
  try {
    const categories = await Category.getCategoryTree();
    res.render('admin/products/create', { 
      title: 'Create Product',
      categories,
      product: null
    });
  } catch (error) {
    console.error('Error loading create form:', error);
    res.status(500).render('error', { message: 'Error loading form' });
  }
};

// Handle product creation with dynamic metadata
exports.store = async (req, res) => {
  try {
    const { name, slug, description, price, originalPrice, stock, category, metadata, 
            isNewOffer, isBestOffer, isFeatured, carouselImage } = req.body;
    
    // Convert metadata object to Map
    const metadataMap = new Map();
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== '') {
          metadataMap.set(key, metadata[key]);
        }
      });
    }
    
    const product = new Product({
      name,
      slug: slug || undefined, // Let pre-save hook generate if empty
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock) || 0,
      category,
      metadata: metadataMap,
      isNewOffer: isNewOffer === 'true',
      isBestOffer: isBestOffer === 'true',
      isFeatured: isFeatured === 'true',
      carouselImage: carouselImage || ''
    });
    
    await product.save();
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error creating product:', error);
    const categories = await Category.getCategoryTree();
    res.status(400).render('admin/products/create', {
      title: 'Create Product',
      categories,
      product: req.body,
      error: error.message
    });
  }
};

// Render edit product form
exports.edit = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }
    
    const categories = await Category.getCategoryTree();
    
    // Get attributes for the product's category
    let attributes = [];
    if (product.category) {
      attributes = await Category.getInheritedAttributes(product.category);
    }
    
    res.render('admin/products/edit', { 
      title: 'Edit Product',
      product,
      categories,
      attributes
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).render('error', { message: 'Error loading form' });
  }
};

// Handle product update
exports.update = async (req, res) => {
  try {
    const { name, slug, description, price, originalPrice, stock, category, metadata,
            isNewOffer, isBestOffer, isFeatured, carouselImage } = req.body;
    
    // Convert metadata object to Map
    const metadataMap = new Map();
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== '') {
          metadataMap.set(key, metadata[key]);
        }
      });
    }
    
    await Product.findByIdAndUpdate(req.params.id, {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock) || 0,
      category,
      metadata: metadataMap,
      isNewOffer: isNewOffer === 'true',
      isBestOffer: isBestOffer === 'true',
      isFeatured: isFeatured === 'true',
      carouselImage: carouselImage || ''
    });
    
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).redirect('/admin/products/' + req.params.id + '/edit');
  }
};

// Handle product deletion
exports.destroy = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
};

// API: Get all products
exports.apiIndex = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort('-createdAt');
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
};

// API: Get single product
exports.apiShow = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
};

// API: Get batch products by IDs (for cart)
exports.apiBatch = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid product IDs' });
    }
    
    const products = await Product.find({ 
      _id: { $in: ids },
      isActive: true 
    }).populate('category', 'name slug');
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching batch products:', error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
};
