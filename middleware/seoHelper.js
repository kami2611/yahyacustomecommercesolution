/**
 * SEO Helper Middleware
 * Fetches SEO data for pages and makes it available in res.locals
 */

const PageContent = require('../models/PageContent');

/**
 * Middleware to fetch SEO data based on a page slug
 * Usage: app.get('/about', fetchSeoData('about'), controller)
 */
const fetchSeoData = (pageSlug) => {
  return async (req, res, next) => {
    try {
      const seoData = await PageContent.getPageSeo(pageSlug);
      res.locals.seo = seoData;
      next();
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      // Continue without SEO data rather than breaking the page
      res.locals.seo = {
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        h1Text: '',
        h2Text: '',
        mainParagraph: '',
        altText: ''
      };
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
    next();
  } catch (error) {
    console.error('Error auto-fetching SEO data:', error);
    res.locals.seo = {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      h1Text: '',
      h2Text: '',
      mainParagraph: '',
      altText: ''
    };
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
    h1Text: seoData.h1Text || defaults.h1Text || '',
    h2Text: seoData.h2Text || defaults.h2Text || '',
    mainParagraph: seoData.mainParagraph || defaults.mainParagraph || '',
    altText: seoData.altText || defaults.altText || '',
    structuredData: seoData.structuredData || defaults.structuredData || '',
    customHeadTags: seoData.customHeadTags || defaults.customHeadTags || ''
  };
};

module.exports = {
  fetchSeoData,
  autoFetchSeoData,
  buildSeoMetadata
};
