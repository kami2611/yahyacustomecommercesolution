const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    enum: ['text', 'number', 'select'],
    default: 'text'
  },
  options: [{
    type: String
  }]
}, { _id: false });

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  attributes: [attributeSchema]
}, {
  timestamps: true
});

// Pre-save hook to generate slug from name if not provided
categorySchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Static method to get all ancestors of a category
categorySchema.statics.getAncestors = async function(categoryId) {
  const ancestors = [];
  let currentCategory = await this.findById(categoryId);
  
  while (currentCategory && currentCategory.parent) {
    currentCategory = await this.findById(currentCategory.parent);
    if (currentCategory) {
      ancestors.unshift(currentCategory);
    }
  }
  
  return ancestors;
};

// Static method to get all inherited attributes (from ancestors + own)
categorySchema.statics.getInheritedAttributes = async function(categoryId) {
  const category = await this.findById(categoryId);
  if (!category) return [];
  
  const ancestors = await this.getAncestors(categoryId);
  
  // Collect all attributes from ancestors first, then own
  let allAttributes = [];
  
  for (const ancestor of ancestors) {
    allAttributes = allAttributes.concat(
      ancestor.attributes.map(attr => ({
        ...attr.toObject ? attr.toObject() : attr,
        inheritedFrom: ancestor.name
      }))
    );
  }
  
  // Add own attributes
  allAttributes = allAttributes.concat(
    category.attributes.map(attr => ({
      ...attr.toObject ? attr.toObject() : attr,
      inheritedFrom: null
    }))
  );
  
  return allAttributes;
};

// Static method to get category tree for dropdowns
categorySchema.statics.getCategoryTree = async function(parentId = null, level = 0) {
  const categories = await this.find({ parent: parentId }).sort('name');
  let tree = [];
  
  for (const category of categories) {
    tree.push({
      _id: category._id,
      name: category.name,
      slug: category.slug,
      level: level,
      parentId: parentId,
      displayName: '—'.repeat(level) + ' ' + category.name
    });
    
    const children = await this.getCategoryTree(category._id, level + 1);
    tree = tree.concat(children);
  }
  
  return tree;
};

module.exports = mongoose.model('Category', categorySchema);
