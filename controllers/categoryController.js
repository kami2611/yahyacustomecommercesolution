const Category = require('../models/Category');

// Render admin category list page
exports.index = async (req, res) => {
  try {
    const categories = await Category.getCategoryTree();
    res.render('admin/categories/index', { 
      title: 'Categories',
      categories 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).render('error', { message: 'Error fetching categories' });
  }
};

// Render create category form
exports.create = async (req, res) => {
  try {
    const categories = await Category.getCategoryTree();
    res.render('admin/categories/create', { 
      title: 'Create Category',
      categories,
      category: null
    });
  } catch (error) {
    console.error('Error loading create form:', error);
    res.status(500).render('error', { message: 'Error loading form' });
  }
};

// Handle category creation
exports.store = async (req, res) => {
  try {
    const { name, slug, parent, description, attributes } = req.body;
    
    // Parse attributes from form data
    let parsedAttributes = [];
    if (attributes && Array.isArray(attributes)) {
      parsedAttributes = attributes.map(attr => ({
        label: attr.label,
        key: attr.key || attr.label.toLowerCase().replace(/\s+/g, '_'),
        fieldType: attr.fieldType || 'text',
        options: attr.options ? 
          (Array.isArray(attr.options) ? attr.options : attr.options.split(',').map(o => o.trim()).filter(o => o)) 
          : []
      })).filter(attr => attr.label && attr.label.trim());
    }
    
    const category = new Category({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || '',
      parent: parent || null,
      attributes: parsedAttributes
    });
    
    await category.save();
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error creating category:', error);
    const categories = await Category.getCategoryTree();
    res.status(400).render('admin/categories/create', {
      title: 'Create Category',
      categories,
      category: req.body,
      error: error.message
    });
  }
};

// Render edit category form
exports.edit = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).render('error', { message: 'Category not found' });
    }
    
    const categories = await Category.getCategoryTree();
    res.render('admin/categories/edit', { 
      title: 'Edit Category',
      category,
      categories: categories.filter(c => c._id.toString() !== category._id.toString())
    });
  } catch (error) {
    console.error('Error loading edit form:', error);
    res.status(500).render('error', { message: 'Error loading form' });
  }
};

// Handle category update
exports.update = async (req, res) => {
  try {
    const { name, slug, parent, description, attributes } = req.body;
    
    // Parse attributes from form data
    let parsedAttributes = [];
    if (attributes && Array.isArray(attributes)) {
      parsedAttributes = attributes.map(attr => ({
        label: attr.label,
        key: attr.key || attr.label.toLowerCase().replace(/\s+/g, '_'),
        fieldType: attr.fieldType || 'text',
        options: attr.options ? 
          (Array.isArray(attr.options) ? attr.options : attr.options.split(',').map(o => o.trim()).filter(o => o)) 
          : []
      })).filter(attr => attr.label && attr.label.trim());
    }
    
    await Category.findByIdAndUpdate(req.params.id, {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || '',
      parent: parent || null,
      attributes: parsedAttributes
    });
    
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).redirect('/admin/categories/' + req.params.id + '/edit');
  }
};

// Handle category deletion
exports.destroy = async (req, res) => {
  try {
    // Check if category has children
    const hasChildren = await Category.exists({ parent: req.params.id });
    if (hasChildren) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category with subcategories' 
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
};

// API: Get category attributes (including inherited)
exports.getAttributes = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const attributes = await Category.getInheritedAttributes(categoryId);
    res.json({ success: true, attributes });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({ success: false, message: 'Error fetching attributes' });
  }
};

// API: Get all categories as tree
exports.apiIndex = async (req, res) => {
  try {
    const categories = await Category.getCategoryTree();
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
};
