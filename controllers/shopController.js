const Product = require('../models/Product');
const Category = require('../models/Category');
const Announcement = require('../models/Announcement');
const Order = require('../models/Order');
const PageContent = require('../models/PageContent');
const { getContentText } = require('../middleware/seoHelper');

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
    
    // Fetch SEO data
    const seo = await PageContent.getPageSeo('shop');
    
    // Helper function to get content text from SEO
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    res.render('shop/index', { 
      title: 'Shop',
      products,
      categories,
      currentCategory,
      announcements,
      seo,
      getText
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
    
    // Fetch SEO data for home page
    const seo = await PageContent.getPageSeo('home');
    
    // Helper function to get content text from SEO
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    res.render('shop/home', { 
      title: 'Home',
      carouselProducts,
      newOffers,
      bestOffers,
      featuredProducts,
      categories,
      nestedCategories,
      announcements,
      seo,
      getText
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
    
    // Fetch SEO data for product pages (can be customized per product later)
    const seo = await PageContent.getPageSeo('product');
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
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
      announcements,
      seo,
      getText
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
    const { sort = 'newest', minPrice, maxPrice, page = 1, attr } = req.query;
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
    
    // Attribute filters
    const attributeFiltersApplied = {};
    if (attr && typeof attr === 'object') {
      Object.entries(attr).forEach(([key, value]) => {
        if (value && value.trim()) {
          filter[`metadata.${key}`] = value;
          attributeFiltersApplied[key] = value;
        }
      });
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
    
    // Get inherited attributes for filtering
    const categoryAttributes = await Category.getInheritedAttributes(category._id);
    
    // Get unique attribute values from products in this category
    const products_for_attrs = await Product.find({ category: { $in: categoryIds }, isActive: true }, 'metadata').lean();
    
    // Build attribute options with available values
    const attributeFilters = categoryAttributes.map(attr => {
      const availableValues = new Set();
      products_for_attrs.forEach(p => {
        if (p.metadata && p.metadata[attr.key]) {
          availableValues.add(p.metadata[attr.key]);
        }
      });
      return {
        ...attr,
        availableValues: Array.from(availableValues).sort()
      };
    }).filter(attr => attr.availableValues.length > 0);
    
    // Fetch SEO data for category pages
    const seo = await PageContent.getPageSeo('category');
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    res.render('shop/category', { 
      title: category.name,
      category,
      products,
      subcategories,
      categories,
      nestedCategories,
      breadcrumbs,
      announcements,
      seo,
      getText,
      attributeFilters,
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
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 1000 },
        attributes: attributeFiltersApplied
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
      const seo = await PageContent.getPageSeo('search');
      const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
      return res.render('shop/search', {
        title: 'Search',
        query: '',
        products: [],
        categories,
        nestedCategories,
        announcements,
        seo,
        getText,
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
    const seo = await PageContent.getPageSeo('search');
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    res.render('shop/search', {
      title: `Search: ${searchQuery}`,
      query: searchQuery,
      products,
      categories,
      nestedCategories,
      announcements,
      seo,
      getText,
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
    const seo = await PageContent.getPageSeo('cart');
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    res.render('shop/cart', {
      title: 'Your Basket',
      categories,
      nestedCategories,
      announcements,
      seo,
      getText
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
    
    // Import Newsletter model
    const Newsletter = require('../models/Newsletter');
    
    // Check if email already exists
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (!existing.isActive) {
        // Reactivate the subscription
        existing.isActive = true;
        existing.unsubscribedAt = null;
        await existing.save();
        return res.json({ success: true, message: 'Welcome back! Your subscription has been reactivated.' });
      }
      return res.json({ success: true, message: 'You are already subscribed!' });
    }
    
    // Create new subscriber
    const subscriber = new Newsletter({
      email: email.toLowerCase(),
      source: 'website'
    });
    
    await subscriber.save();
    
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
    const { sort = 'newest', minPrice, maxPrice, page = 1 } = req.query;
    const limit = 12;
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
    
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    
    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    
    const categories = await Category.getCategoryTree();
    const nestedCategories = await Category.getNestedCategoryTree();
    const announcements = await Announcement.getActiveAnnouncements();
    const seo = await PageContent.getPageSeo('offers');
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    // Build breadcrumbs
    const breadcrumbs = [
      { name: 'Home', url: '/' },
      { name: 'Offers', url: '/offers/new' },
      { name: title, url: null }
    ];
    
    res.render('shop/offers', {
      title,
      type,
      products,
      categories,
      nestedCategories,
      announcements,
      breadcrumbs,
      seo,
      getText,
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
        maxPrice: maxPrice || ''
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
    const seo = await PageContent.getPageSeo('checkout');
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    res.render('shop/checkout', {
      title: 'Checkout',
      categories,
      nestedCategories,
      announcements,
      seo,
      getText
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
      phone2,
      address, 
      city, 
      postalCode, 
      notes,
      cart 
    } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !phone || !phone2 || !address || !city) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required fields' 
      });
    }
    
    // Validate phone numbers are different
    const normalizePhone = (p) => p.replace(/[\s\-\(\)]/g, '');
    if (normalizePhone(phone) === normalizePhone(phone2)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both phone numbers must be different' 
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
        phone2,
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
      orderId: order._id.toString(),
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
    const seo = await PageContent.getPageSeo('track');
    const getText = (key, fallback = '') => getContentText(seo.onPageContent, key, fallback);
    
    if (!orderNumber) {
      return res.render('shop/track', {
        title: 'Track Order',
        categories,
        nestedCategories,
        announcements,
        seo,
        getText
      });
    }
    
    const order = await Order.findByOrderNumber(orderNumber.trim());
    
    if (!order) {
      return res.render('shop/track', {
        title: 'Track Order',
        categories,
        nestedCategories,
        announcements,
        seo,
        getText,
        orderNumber,
        notFound: true
      });
    }
    
    res.render('shop/track', {
      title: `Order ${order.orderNumber}`,
      categories,
      nestedCategories,
      announcements,
      seo,
      getText,
      order,
      orderNumber
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).render('error', { message: 'Error tracking order' });
  }
};
// API: Get order details by ID
exports.apiGetOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    res.json({
      success: true,
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items,
        total: order.total,
        createdAt: order.createdAt,
        customer: {
          fullName: order.customer.fullName,
          email: order.customer.email,
          phone: order.customer.phone
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching order' 
    });
  }
};