const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  backgroundImage: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Pre-save hook to generate slug from name if not provided
brandSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Static method to get active brands for display
brandSchema.statics.getActiveBrands = async function(limit = null) {
  const query = this.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  if (limit) {
    query.limit(limit);
  }
  return query;
};

// Static method to get brand by slug
brandSchema.statics.getBySlug = async function(slug) {
  return this.findOne({ slug, isActive: true });
};

module.exports = mongoose.model('Brand', brandSchema);
