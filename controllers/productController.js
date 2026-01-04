const Product = require('../models/Product');
const Category = require('../models/Category');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

// Render admin product list page
exports.index = async (req, res) => {
  try {
    const { search, category, sortBy, minPrice, maxPrice } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Text search across name and description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by category (including subcategories)
    if (category && category !== 'all') {
      const selectedCategory = await Category.findById(category);
      if (selectedCategory) {
        // Get all descendant categories
        const allCategories = await Category.find();
        const descendantIds = getDescendantCategoryIds(selectedCategory._id, allCategories);
        descendantIds.push(selectedCategory._id);
        filter.category = { $in: descendantIds };
      }
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Build sort object
    let sort = '-createdAt'; // default
    if (sortBy === 'price-asc') sort = 'price';
    else if (sortBy === 'price-desc') sort = '-price';
    else if (sortBy === 'name-asc') sort = 'name';
    else if (sortBy === 'name-desc') sort = '-name';
    else if (sortBy === 'stock-asc') sort = 'stock';
    else if (sortBy === 'stock-desc') sort = '-stock';
    
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sort);
    
    // Get all categories for filter dropdown
    const categories = await Category.getCategoryTree();
    
    res.render('admin/products/index', { 
      title: 'Products',
      products,
      categories,
      filters: { search, category, sortBy, minPrice, maxPrice }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).render('error', { message: 'Error fetching products' });
  }
};

// Helper function to get all descendant category IDs
function getDescendantCategoryIds(parentId, allCategories) {
  const descendants = [];
  const children = allCategories.filter(cat => 
    cat.parentId && cat.parentId.toString() === parentId.toString()
  );
  
  children.forEach(child => {
    descendants.push(child._id);
    descendants.push(...getDescendantCategoryIds(child._id, allCategories));
  });
  
  return descendants;
}

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
      images: req.files ? req.files.map(file => file.path) : [],
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
            isNewOffer, isBestOffer, isFeatured, carouselImage, existingImages } = req.body;
    
    // Convert metadata object to Map
    const metadataMap = new Map();
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined && metadata[key] !== '') {
          metadataMap.set(key, metadata[key]);
        }
      });
    }
    
    // Handle images - combine existing and new
    let images = [];
    
    // Keep existing images that weren't removed
    if (existingImages) {
      images = Array.isArray(existingImages) ? existingImages : [existingImages];
    }
    
    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      images = [...images, ...newImages];
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
      images: images,
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

// Upload additional images to an existing product
exports.uploadImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }
    
    const newImages = req.files.map(file => file.path);
    product.images = [...(product.images || []), ...newImages];
    await product.save();
    
    res.json({ 
      success: true, 
      message: 'Images uploaded successfully',
      images: product.images 
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ success: false, message: 'Error uploading images' });
  }
};

// Delete a specific image from a product
exports.deleteImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const index = parseInt(imageIndex);
    if (index < 0 || index >= product.images.length) {
      return res.status(400).json({ success: false, message: 'Invalid image index' });
    }
    
    // Get the image URL to delete from Cloudinary
    const imageUrl = product.images[index];
    const publicId = getPublicIdFromUrl(imageUrl);
    
    // Delete from Cloudinary if it's a Cloudinary URL
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue even if Cloudinary delete fails
      }
    }
    
    // Remove from product images array
    product.images.splice(index, 1);
    await product.save();
    
    res.json({ 
      success: true, 
      message: 'Image deleted successfully',
      images: product.images 
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, message: 'Error deleting image' });
  }
};
