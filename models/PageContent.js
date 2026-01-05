const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  pageSlug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  pageName: {
    type: String,
    required: true,
    trim: true
  },
  // Search Engine Metadata
  metaTitle: {
    type: String,
    default: '',
    maxlength: 70 // Recommended max length for SEO
  },
  metaDescription: {
    type: String,
    default: '',
    maxlength: 160 // Recommended max length for SEO
  },
  metaKeywords: {
    type: String,
    default: ''
  },
  ogImage: {
    type: String,
    default: ''
  },
  ogType: {
    type: String,
    default: 'website'
  },
  canonicalUrl: {
    type: String,
    default: ''
  },
  robots: {
    type: String,
    default: 'index, follow',
    enum: ['index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow']
  },
  // On-Page Content - Dynamic editable text elements
  onPageContent: {
    type: Map,
    of: new mongoose.Schema({
      originalText: { type: String, default: '' },
      editedText: { type: String, default: '' },
      elementType: { type: String, enum: ['heading', 'paragraph', 'button', 'link', 'label'], default: 'heading' },
      description: { type: String, default: '' }
    }, { _id: false }),
    default: {}
  },
  // Additional SEO fields
  structuredData: {
    type: String,
    default: '' // JSON-LD structured data
  },
  customHeadTags: {
    type: String,
    default: '' // Additional custom head tags
  }
}, {
  timestamps: true
});

// Static method to get SEO data for a page
pageContentSchema.statics.getPageSeo = async function(pageSlug) {
  const seoData = await this.findOne({ pageSlug });
  if (!seoData) {
    // Return default SEO data if page not found
    return {
      pageSlug,
      pageName: pageSlug,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogImage: '',
      ogType: 'website',
      canonicalUrl: '',
      robots: 'index, follow',
      onPageContent: new Map(),
      structuredData: '',
      customHeadTags: ''
    };
  }
  return seoData;
};

// Static method to create or update SEO data
pageContentSchema.statics.upsertPageSeo = async function(pageSlug, data) {
  return await this.findOneAndUpdate(
    { pageSlug },
    { ...data, pageSlug },
    { upsert: true, new: true, runValidators: true }
  );
};

// Static method to get all pages
pageContentSchema.statics.getAllPages = async function() {
  return await this.find().sort('pageName');
};

// Pre-save hook to ensure pageSlug is lowercase
pageContentSchema.pre('save', function(next) {
  if (this.pageSlug) {
    this.pageSlug = this.pageSlug.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('PageContent', pageContentSchema);
