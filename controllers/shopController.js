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

// Category page
exports.category = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    
    if (!category) {
      return res.status(404).render('error', { message: 'Category not found' });
    }
    
    // Get all subcategory IDs (for including products from subcategories)
    const categoryIds = [category._id];
    
    const products = await Product.find({ 
      category: { $in: categoryIds },
      isActive: true 
    })
    .populate('category', 'name slug')
    .sort('-createdAt');
    
    const categories = await Category.getCategoryTree();
    
    res.render('shop/index', { 
      title: category.name,
      products,
      categories,
      currentCategory: category
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).render('error', { message: 'Error loading category' });
  }
};
