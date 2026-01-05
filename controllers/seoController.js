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
    const page = await PageContent.findOne({ pageSlug: slug });
    
    if (!page) {
      return res.redirect('/admin/seo-panel?error=Page not found');
    }
    
    res.render('admin/seo/edit', {
      title: `Edit SEO - ${page.pageName}`,
      page,
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
      h1Text,
      h2Text,
      mainParagraph,
      altText,
      structuredData,
      customHeadTags
    } = req.body;
    
    await PageContent.upsertPageSeo(slug, {
      pageName,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogImage,
      ogType,
      canonicalUrl,
      robots,
      h1Text,
      h2Text,
      mainParagraph,
      altText,
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
