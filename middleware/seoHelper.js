/**
 * SEO Helper Middleware
 * Fetches SEO data for pages and makes it available in res.locals
 */

const PageContent = require('../models/PageContent');

/**
 * Helper function to get text from onPageContent
 * Returns edited text if available, otherwise returns original text
 */
const getContentText = (onPageContent, key, fallback = '') => {
  if (!onPageContent) return fallback;
  
  // Handle both Map and plain object
  let item;
  if (onPageContent instanceof Map) {
    item = onPageContent.get(key);
  } else if (typeof onPageContent === 'object') {
    item = onPageContent[key];
  }
  
  if (!item) return fallback;
  
  // Return edited text if it exists and is not empty, otherwise return original
  return (item.editedText && item.editedText.trim()) ? item.editedText : (item.originalText || fallback);
};

/**
 * Middleware to fetch SEO data based on a page slug
 * Usage: app.get('/about', fetchSeoData('about'), controller)
 */
const fetchSeoData = (pageSlug) => {
  return async (req, res, next) => {
    try {
      const seoData = await PageContent.getPageSeo(pageSlug);
      res.locals.seo = seoData;
      
      // Add helper function to get on-page content text
      res.locals.getContentText = (key, fallback = '') => {
        return getContentText(seoData.onPageContent, key, fallback);
      };
      
      next();
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      // Continue without SEO data rather than breaking the page
      res.locals.seo = {
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        onPageContent: new Map()
      };
      res.locals.getContentText = (key, fallback = '') => fallback;
      next();
    }
  };
};

/**
 * Middleware to automatically detect page slug from route
 * and fetch corresponding SEO data
 */
const autoFetchSeoData = async (req, res, next) => {
  try {
    // Determine page slug from the route
    let pageSlug = 'home';
    
    if (req.path === '/' || req.path === '') {
      pageSlug = 'home';
    } else {
      // Remove leading slash and use first segment
      pageSlug = req.path.substring(1).split('/')[0] || 'home';
    }
    
    const seoData = await PageContent.getPageSeo(pageSlug);
    res.locals.seo = seoData;
    
    // Add helper function to get on-page content text
    res.locals.getContentText = (key, fallback = '') => {
      return getContentText(seoData.onPageContent, key, fallback);
    };
    
    next();
  } catch (error) {
    console.error('Error auto-fetching SEO data:', error);
    res.locals.seo = {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      onPageContent: new Map()
    };
    res.locals.getContentText = (key, fallback = '') => fallback;
    next();
  }
};

/**
 * Helper function to build complete SEO metadata object
 * for use in controllers
 */
const buildSeoMetadata = (seoData, defaults = {}) => {
  const siteName = defaults.siteName || 'E-Commerce Store';
  
  return {
    title: seoData.metaTitle || defaults.title || siteName,
    metaDescription: seoData.metaDescription || defaults.metaDescription || '',
    metaKeywords: seoData.metaKeywords || defaults.metaKeywords || '',
    ogImage: seoData.ogImage || defaults.ogImage || '/images/og-default.jpg',
    ogType: seoData.ogType || defaults.ogType || 'website',
    canonicalUrl: seoData.canonicalUrl || defaults.canonicalUrl || '',
    robots: seoData.robots || defaults.robots || 'index, follow',
    onPageContent: seoData.onPageContent || defaults.onPageContent || new Map(),
    structuredData: seoData.structuredData || defaults.structuredData || '',
    customHeadTags: seoData.customHeadTags || defaults.customHeadTags || ''
  };
};

module.exports = {
  fetchSeoData,
  autoFetchSeoData,
  buildSeoMetadata,
  getContentText
};
