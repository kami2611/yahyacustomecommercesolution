const PageContent = require('../models/PageContent');

// Default pages that should exist in the system
const DEFAULT_PAGES = [
  { pageSlug: 'home', pageName: 'Home Page' },
  { pageSlug: 'shop', pageName: 'Shop / Products Listing' },
  { pageSlug: 'category', pageName: 'Category Pages' },
  { pageSlug: 'product', pageName: 'Product Detail Pages' },
  { pageSlug: 'cart', pageName: 'Shopping Cart' },
  { pageSlug: 'checkout', pageName: 'Checkout' },
  { pageSlug: 'search', pageName: 'Search Results' },
  { pageSlug: 'track', pageName: 'Order Tracking' },
  { pageSlug: 'offers', pageName: 'Special Offers' }
];

// Default on-page content elements for each page type
const DEFAULT_ON_PAGE_CONTENT = {
  home: {
    'section_new_offers_heading': { originalText: 'New Offers', editedText: '', elementType: 'heading', description: 'New Offers section heading' },
    'section_new_offers_button': { originalText: 'Show More New Offers', editedText: '', elementType: 'button', description: 'New Offers show more button' },
    'section_best_offers_heading': { originalText: 'Our Best Offers', editedText: '', elementType: 'heading', description: 'Best Offers section heading' },
    'section_best_offers_button': { originalText: 'Show More Best Offers', editedText: '', elementType: 'button', description: 'Best Offers show more button' },
    'section_featured_heading': { originalText: "Products You'll Love", editedText: '', elementType: 'heading', description: 'Featured Products section heading' },
    'section_featured_button': { originalText: 'Show More Featured Products', editedText: '', elementType: 'button', description: 'Featured Products show more button' },
    'section_reviews_heading': { originalText: 'Customer Reviews', editedText: '', elementType: 'heading', description: 'Customer Reviews section heading' },
    'button_add_to_basket': { originalText: 'Add to Basket', editedText: '', elementType: 'button', description: 'Add to basket button on product cards' },
    'trustpilot_score': { originalText: '4.8 out of 5', editedText: '', elementType: 'paragraph', description: 'Trustpilot score display' },
    'trustpilot_reviews': { originalText: 'Based on 1,234 reviews', editedText: '', elementType: 'paragraph', description: 'Trustpilot reviews count' }
  },
  shop: {
    'page_heading': { originalText: 'All Products', editedText: '', elementType: 'heading', description: 'Main page heading' },
    'sidebar_categories_heading': { originalText: 'Categories', editedText: '', elementType: 'heading', description: 'Sidebar categories heading' },
    'empty_state_message': { originalText: 'No products found in this category.', editedText: '', elementType: 'paragraph', description: 'Empty state message' },
    'button_view_all': { originalText: 'View All Products', editedText: '', elementType: 'button', description: 'View all products button' },
    'button_view_details': { originalText: 'View Details', editedText: '', elementType: 'button', description: 'View details button on product cards' }
  },
  category: {
    'breadcrumb_home': { originalText: 'Home', editedText: '', elementType: 'link', description: 'Breadcrumb home link text' },
    'filter_heading': { originalText: 'Filters', editedText: '', elementType: 'heading', description: 'Filter section heading' },
    'sort_label': { originalText: 'Sort by:', editedText: '', elementType: 'label', description: 'Sort dropdown label' },
    'empty_state_message': { originalText: 'No products found in this category.', editedText: '', elementType: 'paragraph', description: 'Empty state message' }
  },
  product: {
    'button_add_to_basket': { originalText: 'Add to Basket', editedText: '', elementType: 'button', description: 'Add to basket button' },
    'section_description_heading': { originalText: 'Product Description', editedText: '', elementType: 'heading', description: 'Description section heading' },
    'label_in_stock': { originalText: 'In Stock', editedText: '', elementType: 'label', description: 'In stock label' },
    'label_out_of_stock': { originalText: 'Out of Stock', editedText: '', elementType: 'label', description: 'Out of stock label' },
    'section_related_heading': { originalText: 'You May Also Like', editedText: '', elementType: 'heading', description: 'Related products section heading' }
  },
  cart: {
    'page_heading': { originalText: 'Your Basket', editedText: '', elementType: 'heading', description: 'Cart page heading' },
    'summary_heading': { originalText: 'Order Summary', editedText: '', elementType: 'heading', description: 'Order summary heading' },
    'label_subtotal': { originalText: 'Subtotal', editedText: '', elementType: 'label', description: 'Subtotal label' },
    'label_delivery': { originalText: 'Delivery', editedText: '', elementType: 'label', description: 'Delivery label' },
    'label_free': { originalText: 'FREE', editedText: '', elementType: 'label', description: 'Free delivery label' },
    'label_total': { originalText: 'Total', editedText: '', elementType: 'label', description: 'Total label' },
    'button_checkout': { originalText: 'Proceed to Checkout', editedText: '', elementType: 'button', description: 'Checkout button' },
    'button_continue_shopping': { originalText: 'Continue Shopping', editedText: '', elementType: 'button', description: 'Continue shopping button' },
    'empty_heading': { originalText: 'Your basket is empty', editedText: '', elementType: 'heading', description: 'Empty cart heading' },
    'empty_message': { originalText: "Looks like you haven't added anything to your basket yet.", editedText: '', elementType: 'paragraph', description: 'Empty cart message' },
    'button_start_shopping': { originalText: 'Start Shopping', editedText: '', elementType: 'button', description: 'Start shopping button' }
  },
  checkout: {
    'page_heading': { originalText: 'Checkout', editedText: '', elementType: 'heading', description: 'Checkout page heading' },
    'section_delivery_heading': { originalText: 'Delivery Information', editedText: '', elementType: 'heading', description: 'Delivery information section heading' },
    'section_payment_heading': { originalText: 'Payment Method', editedText: '', elementType: 'heading', description: 'Payment method section heading' },
    'label_cod': { originalText: 'Cash on Delivery', editedText: '', elementType: 'label', description: 'Cash on delivery option label' },
    'button_place_order': { originalText: 'Place Order', editedText: '', elementType: 'button', description: 'Place order button' },
    'label_name': { originalText: 'Full Name', editedText: '', elementType: 'label', description: 'Full name input label' },
    'label_phone': { originalText: 'Phone Number', editedText: '', elementType: 'label', description: 'Phone number input label' },
    'label_address': { originalText: 'Delivery Address', editedText: '', elementType: 'label', description: 'Address input label' },
    'label_city': { originalText: 'City', editedText: '', elementType: 'label', description: 'City input label' }
  },
  search: {
    'page_heading': { originalText: 'Search Results', editedText: '', elementType: 'heading', description: 'Search results page heading' },
    'results_for': { originalText: 'Results for', editedText: '', elementType: 'label', description: 'Results for text' },
    'no_results_heading': { originalText: 'No results found', editedText: '', elementType: 'heading', description: 'No results heading' },
    'no_results_message': { originalText: 'Try searching with different keywords.', editedText: '', elementType: 'paragraph', description: 'No results message' }
  },
  track: {
    'page_heading': { originalText: 'Track Your Order', editedText: '', elementType: 'heading', description: 'Track order page heading' },
    'label_order_id': { originalText: 'Order ID', editedText: '', elementType: 'label', description: 'Order ID input label' },
    'button_track': { originalText: 'Track Order', editedText: '', elementType: 'button', description: 'Track order button' },
    'status_pending': { originalText: 'Pending', editedText: '', elementType: 'label', description: 'Pending status label' },
    'status_processing': { originalText: 'Processing', editedText: '', elementType: 'label', description: 'Processing status label' },
    'status_shipped': { originalText: 'Shipped', editedText: '', elementType: 'label', description: 'Shipped status label' },
    'status_delivered': { originalText: 'Delivered', editedText: '', elementType: 'label', description: 'Delivered status label' }
  },
  offers: {
    'page_heading': { originalText: 'Special Offers', editedText: '', elementType: 'heading', description: 'Special offers page heading' },
    'section_hot_deals': { originalText: 'Hot Deals', editedText: '', elementType: 'heading', description: 'Hot deals section heading' },
    'section_limited_time': { originalText: 'Limited Time Offers', editedText: '', elementType: 'heading', description: 'Limited time offers section heading' },
    'badge_sale': { originalText: 'SALE', editedText: '', elementType: 'label', description: 'Sale badge text' }
  }
};

/**
 * SEO Login Page
 */
exports.loginPage = (req, res) => {
  res.render('admin/seo/login', {
    title: 'SEO Admin Login',
    error: null,
    layout: false
  });
};

/**
 * Handle SEO Login
 */
exports.login = (req, res) => {
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
};

/**
 * SEO Logout
 */
exports.logout = (req, res) => {
  req.session.isSeoAuthenticated = false;
  delete req.session.isSeoAuthenticated;
  res.redirect('/admin/seo-login');
};

/**
 * SEO Dashboard - List all pages
 */
exports.dashboard = async (req, res) => {
  try {
    // Initialize default pages if they don't exist
    for (const page of DEFAULT_PAGES) {
      const existing = await PageContent.findOne({ pageSlug: page.pageSlug });
      if (!existing) {
        await PageContent.create(page);
      }
    }
    
    // Get all pages
    const pages = await PageContent.getAllPages();
    
    res.render('admin/seo/index', {
      title: 'SEO Dashboard',
      pages,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error loading SEO dashboard:', error);
    res.status(500).render('error', { message: 'Error loading SEO dashboard' });
  }
};

/**
 * Edit Page SEO - Show form
 */
exports.editPage = async (req, res) => {
  try {
    const { slug } = req.params;
    let page = await PageContent.findOne({ pageSlug: slug });
    
    if (!page) {
      return res.redirect('/admin/seo-panel?error=Page not found');
    }
    
    // Initialize on-page content with defaults if not set
    const defaultContent = DEFAULT_ON_PAGE_CONTENT[slug] || {};
    let onPageContentObj = {};
    
    // Convert Map to object and merge with defaults
    if (page.onPageContent && page.onPageContent instanceof Map) {
      page.onPageContent.forEach((value, key) => {
        onPageContentObj[key] = value;
      });
    }
    
    // Merge defaults with existing content
    for (const [key, defaultVal] of Object.entries(defaultContent)) {
      if (!onPageContentObj[key]) {
        onPageContentObj[key] = defaultVal;
      } else {
        // Preserve existing edited text but ensure all fields exist
        onPageContentObj[key] = {
          ...defaultVal,
          ...onPageContentObj[key],
          originalText: defaultVal.originalText // Always use default original text
        };
      }
    }
    
    res.render('admin/seo/edit', {
      title: `Edit SEO - ${page.pageName}`,
      page,
      onPageContent: onPageContentObj,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Error loading page for editing:', error);
    res.status(500).render('error', { message: 'Error loading page' });
  }
};

/**
 * Update Page SEO
 */
exports.updatePage = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      pageName,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      ogType,
      canonicalUrl,
      robots,
      structuredData,
      customHeadTags
    } = req.body;
    
    // Process on-page content from form
    const onPageContent = new Map();
    const defaultContent = DEFAULT_ON_PAGE_CONTENT[slug] || {};
    
    for (const key of Object.keys(defaultContent)) {
      const editedText = req.body[`onpage_${key}`] || '';
      onPageContent.set(key, {
        originalText: defaultContent[key].originalText,
        editedText: editedText,
        elementType: defaultContent[key].elementType,
        description: defaultContent[key].description
      });
    }
    
    await PageContent.upsertPageSeo(slug, {
      pageName,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      ogType,
      canonicalUrl,
      robots,
      onPageContent,
      structuredData,
      customHeadTags
    });
    
    res.redirect(`/admin/seo-panel/edit/${slug}?success=Page SEO updated successfully`);
  } catch (error) {
    console.error('Error updating page SEO:', error);
    res.redirect(`/admin/seo-panel/edit/${slug}?error=Error updating page SEO`);
  }
};

/**
 * Create New Page - Show form
 */
exports.createPage = (req, res) => {
  res.render('admin/seo/create', {
    title: 'Add New Page',
    error: null
  });
};

/**
 * Create New Page - Handle form submission
 */
exports.storePage = async (req, res) => {
  try {
    const { pageSlug, pageName } = req.body;
    
    // Check if page already exists
    const existing = await PageContent.findOne({ pageSlug: pageSlug.toLowerCase() });
    if (existing) {
      return res.render('admin/seo/create', {
        title: 'Add New Page',
        error: 'A page with this slug already exists'
      });
    }
    
    // Create the page
    await PageContent.create({
      pageSlug: pageSlug.toLowerCase(),
      pageName
    });
    
    res.redirect('/admin/seo-panel?success=Page created successfully');
  } catch (error) {
    console.error('Error creating page:', error);
    res.render('admin/seo/create', {
      title: 'Add New Page',
      error: 'Error creating page'
    });
  }
};

/**
 * Delete Page
 */
exports.deletePage = async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Prevent deletion of default pages
    const isDefault = DEFAULT_PAGES.some(p => p.pageSlug === slug);
    if (isDefault) {
      return res.redirect('/admin/seo-panel?error=Cannot delete default pages');
    }
    
    await PageContent.findOneAndDelete({ pageSlug: slug });
    res.redirect('/admin/seo-panel?success=Page deleted successfully');
  } catch (error) {
    console.error('Error deleting page:', error);
    res.redirect('/admin/seo-panel?error=Error deleting page');
  }
};

/**
 * API: Get SEO data for a page
 */
exports.getPageSeoApi = async (req, res) => {
  try {
    const { slug } = req.params;
    const seoData = await PageContent.getPageSeo(slug);
    res.json({ success: true, data: seoData });
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    res.status(500).json({ success: false, message: 'Error fetching SEO data' });
  }
};
