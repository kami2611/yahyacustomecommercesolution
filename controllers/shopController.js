const Product = require('../models/Product');
const Category = require('../models/Category');
const Announcement = require('../models/Announcement');
const Order = require('../models/Order');

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
    const announcements = await Announcement.getActiveAnnouncements();
    
    res.render('shop/index', { 
      title: 'Shop',
      products,
      categories,
      currentCategory,
      announcements
    });
  } catch (error) {
    console.error('Error fetching shop products:', error);
    res.status(500).render('error', { message: 'Error loading shop' });
  }
};

// Home page with featured sections
exports.home = async (req, res) => {
  try {
    // Fetch announcements
    const announcements = await Announcement.getActiveAnnouncements();
    
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
    .limit(12);
    
    const bestOffers = await Product.find({ 
      isActive: true,
      isBestOffer: true 
    })
    .populate('category', 'name slug')
    .limit(12);
    
    const featuredProducts = await Product.find({ 
      isActive: true,
      isFeatured: true 
    })
    .populate('category', 'name slug')
    .limit(12);
    
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    
    res.render('shop/home', { 
      title: 'Home',
      carouselProducts,
      newOffers,
      bestOffers,
      featuredProducts,
      categories,
      nestedCategories,
      announcements
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
    
    // Get breadcrumb trail with SEO-friendly URLs
    let breadcrumbs = [{ name: 'Home', url: '/' }];
    let categoryPath = '';
    if (product.category) {
      const categoryDoc = await Category.findById(product.category._id);
      if (categoryDoc) {
        const ancestors = await Category.getAncestors(product.category._id);
        ancestors.forEach(ancestor => {
          categoryPath += (categoryPath ? '/' : '') + ancestor.slug;
          breadcrumbs.push({ name: ancestor.name, url: `/category/${categoryPath}` });
        });
        categoryPath += (categoryPath ? '/' : '') + categoryDoc.slug;
        breadcrumbs.push({ name: categoryDoc.name, url: `/category/${categoryPath}` });
      }
    }
    breadcrumbs.push({ name: product.name, url: null });
    
    // Build the canonical SEO-friendly URL for this product
    const productUrl = categoryPath ? `/${categoryPath}/${product.slug}` : `/product/${product.slug}`;
    
    // Similar products - same category, excluding current product
    let similarProducts = [];
    if (product.category) {
      similarProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        isActive: true
      })
      .populate('category', 'name slug')
      .limit(6);
    }
    
    // You may also like - featured or random products from other categories
    const youMayAlsoLike = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { isFeatured: true },
        { isBestOffer: true }
      ]
    })
    .populate('category', 'name slug')
    .limit(6);
    
    // Get all categories for mega nav
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    
    res.render('shop/product', { 
      title: product.name,
      product,
      attributes,
      breadcrumbs,
      productUrl,
      categoryPath,
      similarProducts,
      youMayAlsoLike,
      categories,
      nestedCategories,
      announcements
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).render('error', { message: 'Error loading product' });
  }
};

// Product page via SEO-friendly URL path
exports.showByPath = async (req, res) => {
  try {
    // Get the product slug from the last segment
    const pathParts = Object.values(req.params).filter(Boolean);
    const productSlug = pathParts[pathParts.length - 1];
    
    // Try to find product by slug
    const product = await Product.findOne({ 
      slug: productSlug,
      isActive: true 
    }).populate('category', 'name slug');
    
    if (!product) {
      // Not a product, might be a category - redirect to category handler
      return res.status(404).render('error', { message: 'Product not found' });
    }
    
    // Delegate to the standard show method
    req.params.slug = productSlug;
    return exports.show(req, res);
  } catch (error) {
    console.error('Error fetching product by path:', error);
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
    
    // Get all descendant category IDs to include products from subcategories
    const categoryIds = await Category.getAllDescendantIds(category._id);
    
    // Build filter - include all products from this category and its descendants
    const filter = {
      category: { $in: categoryIds },
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
    
    // Get ancestors for breadcrumbs with SEO-friendly URLs
    const ancestors = await Category.getAncestors(category._id);
    let pathSoFar = '';
    ancestors.forEach(ancestor => {
      pathSoFar += (pathSoFar ? '/' : '') + ancestor.slug;
      breadcrumbs.push({ name: ancestor.name, url: `/category/${pathSoFar}` });
    });
    breadcrumbs.push({ name: category.name, url: null });
    
    // Get all categories for navigation (nested structure for mobile menu)
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    
    // Get price range for filters (from all descendants)
    const priceRange = await Product.aggregate([
      { $match: { category: { $in: categoryIds }, isActive: true } },
      { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } }
    ]);
    
    res.render('shop/category', { 
      title: category.name,
      category,
      products,
      subcategories,
      categories,
      nestedCategories,
      breadcrumbs,
      announcements,
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

// Search products
exports.search = async (req, res) => {
  try {
    const { q, sort = 'relevance', page = 1 } = req.query;
    const limit = 12;
    const skip = (parseInt(page) - 1) * limit;
    
    if (!q || q.trim() === '') {
      const categories = await Category.getCategoryTree();
      const nestedCategories = await Category.getNestedCategoryTree();
      const announcements = await Announcement.getActiveAnnouncements();
      return res.render('shop/search', {
        title: 'Search',
        query: '',
        products: [],
        categories,
        nestedCategories,
        announcements,
        pagination: { currentPage: 1, totalPages: 0, totalProducts: 0 },
        filters: { sort: 'relevance' }
      });
    }
    
    const searchQuery = q.trim();
    
    // Build search filter using regex for partial matching
    const searchFilter = {
      isActive: true,
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    // Sort options
    let sortOption = { score: { $meta: 'textScore' } };
    if (sort === 'price-low') sortOption = { price: 1 };
    else if (sort === 'price-high') sortOption = { price: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else sortOption = { createdAt: -1 }; // Default to newest if no text index
    
    const totalProducts = await Product.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    const products = await Product.find(searchFilter)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    
    res.render('shop/search', {
      title: `Search: ${searchQuery}`,
      query: searchQuery,
      products,
      categories,
      nestedCategories,
      announcements,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      filters: { sort }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).render('error', { message: 'Error searching products' });
  }
};

// Cart page
exports.cart = async (req, res) => {
  try {
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    
    res.render('shop/cart', {
      title: 'Your Basket',
      categories,
      nestedCategories,
      announcements
    });
  } catch (error) {
    console.error('Error loading cart:', error);
    res.status(500).render('error', { message: 'Error loading cart' });
  }
};

// Newsletter subscribe
exports.newsletterSubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }
    
    // In a real app, you would save this to a database or send to an email service
    // For now, we'll just return success
    console.log('Newsletter subscription:', email);
    
    res.json({ success: true, message: 'Thank you for subscribing!' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ success: false, message: 'Error subscribing. Please try again.' });
  }
};

// Offers page (new, best, featured)
exports.offers = async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;
    
    let filter = { isActive: true };
    let title = 'Offers';
    
    switch (type) {
      case 'new':
        filter.isNewOffer = true;
        title = 'New Offers';
        break;
      case 'best':
        filter.isBestOffer = true;
        title = 'Best Offers';
        break;
      case 'featured':
        filter.isFeatured = true;
        title = 'Featured Products';
        break;
      default:
        return res.status(404).render('error', { message: 'Offers page not found' });
    }
    
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const categories = await Category.getCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    
    res.render('shop/offers', {
      title,
      type,
      products,
      categories,
      announcements,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).render('error', { message: 'Error loading offers' });
  }
};

// Checkout page
exports.checkout = async (req, res) => {
  try {
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    
    res.render('shop/checkout', {
      title: 'Checkout',
      categories,
      nestedCategories,
      announcements
    });
  } catch (error) {
    console.error('Error loading checkout:', error);
    res.status(500).render('error', { message: 'Error loading checkout' });
  }
};

// Place order
exports.placeOrder = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      address, 
      city, 
      postalCode, 
      notes,
      cart 
    } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !phone || !address || !city) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }
    
    if (!cart || cart.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Your cart is empty' 
      });
    }
    
    // Fetch product details and calculate total
    const productIds = cart.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    
    let subtotal = 0;
    const orderItems = [];
    
    for (const cartItem of cart) {
      const product = products.find(p => p._id.toString() === cartItem.productId);
      if (product) {
        const itemTotal = product.price * cartItem.quantity;
        subtotal += itemTotal;
        orderItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          total: itemTotal,
          image: product.images && product.images.length > 0 ? product.images[0] : null
        });
      }
    }
    
    // Generate order number
    const orderNumber = Order.generateOrderNumber();
    
    // Create the order in database
    const order = await Order.create({
      orderNumber,
      customer: { 
        fullName, 
        email, 
        phone, 
        address, 
        city, 
        postalCode 
      },
      items: orderItems,
      subtotal,
      deliveryFee: 0,
      total: subtotal,
      paymentMethod: 'Cash on Delivery',
      notes,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        note: 'Order placed',
        updatedAt: new Date()
      }]
    });
    
    res.json({ 
      success: true, 
      message: 'Order placed successfully!',
      orderNumber: order.orderNumber,
      total: order.total
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ success: false, message: 'Error placing order. Please try again.' });
  }
};

// Track order
exports.trackOrder = async (req, res) => {
  try {
    const { order: orderNumber } = req.query;
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    
    if (!orderNumber) {
      return res.render('shop/track', {
        title: 'Track Order',
        categories,
        nestedCategories,
        announcements
      });
    }
    
    const order = await Order.findByOrderNumber(orderNumber.trim());
    
    if (!order) {
      return res.render('shop/track', {
        title: 'Track Order',
        categories,
        nestedCategories,
        announcements,
        orderNumber,
        notFound: true
      });
    }
    
    res.render('shop/track', {
      title: `Order ${order.orderNumber}`,
      categories,
      nestedCategories,
      announcements,
      order,
      orderNumber
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).render('error', { message: 'Error tracking order' });
  }
};
