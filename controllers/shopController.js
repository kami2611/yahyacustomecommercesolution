const Product = require('../models/Product');
const Category = require('../models/Category');

// Shop homepage - list all products
exports.index = async (req, res) => {
  try {
    const { category: categorySlug } = req.query;
    
    let filter = { isActive: true };
    let currentCategory = null;
    
    if (categorySlug) {
      currentCategory = await Category.findOne({ slug: categorySlug });
      if (currentCategory) {
        filter.category = currentCategory._id;
      }
    }
    
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort('-createdAt')
      .limit(50);
    
    const categories = await Category.getCategoryTree();
    
    res.render('shop/index', { 
      title: 'Shop',
      products,
      categories,
      currentCategory
    });
  } catch (error) {
    console.error('Error fetching shop products:', error);
    res.status(500).render('error', { message: 'Error loading shop' });
  }
};

// Home page with featured sections
exports.home = async (req, res) => {
  try {
    // Fetch all featured products for different sections
    const carouselProducts = await Product.find({ 
      isActive: true,
      carouselImage: { $exists: true, $ne: '' }
    })
    .limit(5)
    .select('name slug carouselImage');
    
    const newOffers = await Product.find({ 
      isActive: true,
      isNewOffer: true 
    })
    .populate('category', 'name slug')
    .limit(8);
    
    const bestOffers = await Product.find({ 
      isActive: true,
      isBestOffer: true 
    })
    .populate('category', 'name slug')
    .limit(8);
    
    const featuredProducts = await Product.find({ 
      isActive: true,
      isFeatured: true 
    })
    .populate('category', 'name slug')
    .limit(8);
    
    const categories = await Category.getCategoryTree();
    
    res.render('shop/home', { 
      title: 'Home',
      carouselProducts,
      newOffers,
      bestOffers,
      featuredProducts,
      categories
    });
  } catch (error) {
    console.error('Error fetching home page data:', error);
    res.status(500).render('error', { message: 'Error loading home page' });
  }
};

// Single product page
exports.show = async (req, res) => {
  try {
    const product = await Product.findOne({ 
      slug: req.params.slug,
      isActive: true 
    }).populate('category', 'name slug');
    
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }
    
    // Get the category's inherited attributes to display metadata properly
    let attributes = [];
    if (product.category) {
      attributes = await Category.getInheritedAttributes(product.category._id);
    }
    
    res.render('shop/product', { 
      title: product.name,
      product,
      attributes
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).render('error', { message: 'Error loading product' });
  }
};

// Category page with filters, sorting, pagination
exports.category = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate('parent');
    
    if (!category) {
      return res.status(404).render('error', { message: 'Category not found' });
    }
    
    // Get query parameters
    const { sort = 'newest', minPrice, maxPrice, page = 1 } = req.query;
    const limit = 12;
    const skip = (parseInt(page) - 1) * limit;
    
    // Build filter
    const filter = {
      category: category._id,
      isActive: true
    };
    
    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Sort options
    let sortOption = { createdAt: -1 }; // default newest
    switch (sort) {
      case 'price-low':
        sortOption = { price: 1 };
        break;
      case 'price-high':
        sortOption = { price: -1 };
        break;
      case 'name-az':
        sortOption = { name: 1 };
        break;
      case 'name-za':
        sortOption = { name: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Get products with pagination
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    // Get all subcategories
    const subcategories = await Category.find({ parent: category._id });
    
    // Build breadcrumbs
    const breadcrumbs = [{ name: 'Home', url: '/' }];
    
    // Get ancestors for breadcrumbs
    const ancestors = await Category.getAncestors(category._id);
    ancestors.forEach(ancestor => {
      breadcrumbs.push({ name: ancestor.name, url: `/category/${ancestor.slug}` });
    });
    breadcrumbs.push({ name: category.name, url: null });
    
    // Get all categories for navigation
    const categories = await Category.getCategoryTree();
    
    // Get price range for filters
    const priceRange = await Product.aggregate([
      { $match: { category: category._id, isActive: true } },
      { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } }
    ]);
    
    res.render('shop/category', { 
      title: category.name,
      category,
      products,
      subcategories,
      categories,
      breadcrumbs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        sort,
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 }
      }
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).render('error', { message: 'Error loading category' });
  }
};
