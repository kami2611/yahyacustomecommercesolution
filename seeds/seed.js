/**
 * Seed file to populate the database with categories and 50 dummy products
 * Run with: node seeds/seed.js
 */

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Announcement = require('../models/Announcement');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce';

// Default announcements
const announcementsData = [
  { text: '🚚 FREE DELIVERY on orders over Rs 5,000!', order: 0, isActive: true },
  { text: '🎉 NEW YEAR SALE - Up to 50% OFF on selected items!', order: 1, isActive: true },
  { text: '💳 Cash on Delivery available nationwide', order: 2, isActive: true },
  { text: '⭐ Trusted by 10,000+ happy customers', order: 3, isActive: true },
  { text: '🔄 Easy 7-day returns & exchanges', order: 4, isActive: true }
];

// Real product images from various sources
const productImages = {
  phones: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500'
  ],
  laptops: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=500',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500'
  ],
  accessories: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500',
    'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=500',
    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500'
  ],
  mens: [
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500',
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500'
  ],
  womens: [
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500',
    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500',
    'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=500',
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500'
  ],
  kids: [
    'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500',
    'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=500',
    'https://images.unsplash.com/photo-1543512214-318c7553f230?w=500'
  ],
  furniture: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
    'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=500',
    'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500'
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=500',
    'https://images.unsplash.com/photo-1593618998160-e34014e67f23?w=500',
    'https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=500'
  ],
  garden: [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'
  ],
  fitness: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
    'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=500',
    'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=500',
    'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=500'
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500',
    'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500',
    'https://images.unsplash.com/photo-1536746803623-cef87080bfc8?w=500'
  ],
  crafts: [
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500'
  ]
};

// Sample categories with hierarchy
const categoriesData = [
  // Root categories
  { name: 'Electronics', slug: 'electronics', parent: null, attributes: [
    { label: 'Brand', key: 'brand', fieldType: 'text' },
    { label: 'Warranty', key: 'warranty', fieldType: 'select', options: ['1 Year', '2 Years', '3 Years'] }
  ]},
  { name: 'Clothing', slug: 'clothing', parent: null, attributes: [
    { label: 'Size', key: 'size', fieldType: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { label: 'Color', key: 'color', fieldType: 'text' }
  ]},
  { name: 'Home & Garden', slug: 'home-garden', parent: null, attributes: [
    { label: 'Material', key: 'material', fieldType: 'text' }
  ]},
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', parent: null, attributes: [] },
  { name: 'Arts & Crafts', slug: 'arts-crafts', parent: null, attributes: [
    { label: 'Age Group', key: 'ageGroup', fieldType: 'select', options: ['Kids', 'Teens', 'Adults', 'All Ages'] }
  ]},
  
  // Sub-categories for Electronics
  { name: 'Phones', slug: 'phones', parentSlug: 'electronics', attributes: [
    { label: 'Screen Size', key: 'screenSize', fieldType: 'text' },
    { label: 'Storage', key: 'storage', fieldType: 'select', options: ['64GB', '128GB', '256GB', '512GB'] }
  ]},
  { name: 'Laptops', slug: 'laptops', parentSlug: 'electronics', attributes: [
    { label: 'RAM', key: 'ram', fieldType: 'select', options: ['8GB', '16GB', '32GB'] },
    { label: 'Processor', key: 'processor', fieldType: 'text' }
  ]},
  { name: 'Accessories', slug: 'electronics-accessories', parentSlug: 'electronics', attributes: [] },
  
  // Sub-categories for Clothing
  { name: 'Men', slug: 'mens-clothing', parentSlug: 'clothing', attributes: [] },
  { name: 'Women', slug: 'womens-clothing', parentSlug: 'clothing', attributes: [] },
  { name: 'Kids', slug: 'kids-clothing', parentSlug: 'clothing', attributes: [] },
  
  // Sub-categories for Home & Garden
  { name: 'Furniture', slug: 'furniture', parentSlug: 'home-garden', attributes: [
    { label: 'Dimensions', key: 'dimensions', fieldType: 'text' }
  ]},
  { name: 'Kitchen', slug: 'kitchen', parentSlug: 'home-garden', attributes: [] },
  { name: 'Garden Tools', slug: 'garden-tools', parentSlug: 'home-garden', attributes: [] },
  
  // Sub-categories for Sports
  { name: 'Fitness', slug: 'fitness', parentSlug: 'sports-outdoors', attributes: [] },
  { name: 'Outdoor Gear', slug: 'outdoor-gear', parentSlug: 'sports-outdoors', attributes: [] },
  
  // Sub-categories for Arts & Crafts
  { name: 'Adhesives & Tapes', slug: 'adhesives-tapes', parentSlug: 'arts-crafts', attributes: [
    { label: 'Length', key: 'length', fieldType: 'text' },
    { label: 'Width', key: 'width', fieldType: 'text' }
  ]},
  { name: 'Paints & Brushes', slug: 'paints-brushes', parentSlug: 'arts-crafts', attributes: [] },
  { name: 'Paper & Card', slug: 'paper-card', parentSlug: 'arts-crafts', attributes: [] }
];

// 50 products with varied data
const productsData = [
  // Electronics - Phones (5)
  { name: 'Smartphone Pro Max 256GB', price: 89999, originalPrice: 99999, category: 'phones', description: 'Latest flagship smartphone with amazing camera and display.', metadata: { brand: 'TechBrand', screenSize: '6.7 inches', storage: '256GB' }, isNewOffer: true },
  { name: 'Budget Phone 64GB', price: 15999, originalPrice: 18999, category: 'phones', description: 'Affordable smartphone for everyday use.', metadata: { brand: 'ValueTech', screenSize: '6.1 inches', storage: '64GB' }, isBestOffer: true },
  { name: 'Gaming Phone X', price: 65000, originalPrice: null, category: 'phones', description: 'High performance gaming smartphone.', metadata: { brand: 'GameTech', screenSize: '6.8 inches', storage: '512GB' }, isFeatured: true },
  { name: 'Compact Phone Mini', price: 45000, originalPrice: 52000, category: 'phones', description: 'Compact design with powerful features.', metadata: { brand: 'TechBrand', screenSize: '5.4 inches', storage: '128GB' } },
  { name: 'Business Phone Elite', price: 72000, originalPrice: null, category: 'phones', description: 'Professional smartphone for business users.', metadata: { brand: 'ProTech', screenSize: '6.5 inches', storage: '256GB' } },
  
  // Electronics - Laptops (5)
  { name: 'UltraBook Pro 15', price: 125000, originalPrice: 145000, category: 'laptops', description: 'Thin and light laptop for professionals.', metadata: { brand: 'TechBook', ram: '16GB', processor: 'Intel i7' }, isNewOffer: true },
  { name: 'Gaming Laptop RTX', price: 175000, originalPrice: null, category: 'laptops', description: 'High-end gaming laptop with RTX graphics.', metadata: { brand: 'GameBook', ram: '32GB', processor: 'Intel i9' }, isFeatured: true },
  { name: 'Student Laptop Basic', price: 45000, originalPrice: 55000, category: 'laptops', description: 'Affordable laptop for students.', metadata: { brand: 'ValueBook', ram: '8GB', processor: 'Intel i5' }, isBestOffer: true },
  { name: 'MacStyle Air 13', price: 95000, originalPrice: null, category: 'laptops', description: 'Elegant design with all-day battery life.', metadata: { brand: 'ProBook', ram: '16GB', processor: 'M2 Chip' } },
  { name: 'Workstation Laptop 17', price: 220000, originalPrice: 250000, category: 'laptops', description: 'Powerful workstation for creative professionals.', metadata: { brand: 'ProBook', ram: '32GB', processor: 'Intel Xeon' } },
  
  // Electronics - Accessories (5)
  { name: 'Wireless Earbuds Pro', price: 8999, originalPrice: 12999, category: 'electronics-accessories', description: 'Premium wireless earbuds with noise cancellation.', metadata: { brand: 'AudioTech' }, isBestOffer: true },
  { name: 'Fast Charger 65W', price: 2499, originalPrice: null, category: 'electronics-accessories', description: 'Quick charging adapter for all devices.', metadata: { brand: 'PowerTech' } },
  { name: 'USB-C Hub 7-in-1', price: 4500, originalPrice: 5500, category: 'electronics-accessories', description: 'Multi-port hub for laptops.', metadata: { brand: 'ConnectPro' } },
  { name: 'Bluetooth Mouse', price: 1299, originalPrice: 1599, category: 'electronics-accessories', description: 'Ergonomic wireless mouse.', metadata: { brand: 'ClickTech' }, isNewOffer: true },
  { name: 'Laptop Stand Aluminum', price: 3500, originalPrice: null, category: 'electronics-accessories', description: 'Adjustable aluminum laptop stand.', metadata: { brand: 'DeskPro' } },
  
  // Clothing - Men (5)
  { name: 'Classic Cotton T-Shirt', price: 999, originalPrice: 1499, category: 'mens-clothing', description: 'Comfortable cotton t-shirt for everyday wear.', metadata: { size: 'M', color: 'Navy Blue' }, isBestOffer: true },
  { name: 'Formal Dress Shirt', price: 2500, originalPrice: null, category: 'mens-clothing', description: 'Elegant formal shirt for office wear.', metadata: { size: 'L', color: 'White' } },
  { name: 'Denim Jeans Regular', price: 3200, originalPrice: 3999, category: 'mens-clothing', description: 'Classic fit denim jeans.', metadata: { size: 'M', color: 'Blue' }, isNewOffer: true },
  { name: 'Sports Jacket', price: 5500, originalPrice: 7000, category: 'mens-clothing', description: 'Lightweight sports jacket.', metadata: { size: 'L', color: 'Black' } },
  { name: 'Winter Hoodie', price: 2800, originalPrice: null, category: 'mens-clothing', description: 'Warm fleece hoodie for winter.', metadata: { size: 'XL', color: 'Gray' }, isFeatured: true },
  
  // Clothing - Women (5)
  { name: 'Floral Summer Dress', price: 3500, originalPrice: 4500, category: 'womens-clothing', description: 'Beautiful floral print summer dress.', metadata: { size: 'S', color: 'Pink' }, isNewOffer: true },
  { name: 'Classic Blazer', price: 6500, originalPrice: null, category: 'womens-clothing', description: 'Professional blazer for work.', metadata: { size: 'M', color: 'Black' } },
  { name: 'Yoga Pants', price: 1800, originalPrice: 2200, category: 'womens-clothing', description: 'Comfortable yoga pants with stretch.', metadata: { size: 'S', color: 'Purple' }, isBestOffer: true },
  { name: 'Silk Scarf', price: 1200, originalPrice: null, category: 'womens-clothing', description: 'Elegant silk scarf with patterns.', metadata: { size: 'One Size', color: 'Multi' } },
  { name: 'Denim Jacket', price: 4200, originalPrice: 5000, category: 'womens-clothing', description: 'Trendy denim jacket.', metadata: { size: 'M', color: 'Light Blue' }, isFeatured: true },
  
  // Clothing - Kids (3)
  { name: 'Kids Rainbow T-Shirt', price: 699, originalPrice: 899, category: 'kids-clothing', description: 'Colorful t-shirt for kids.', metadata: { size: 'S', color: 'Rainbow' }, isNewOffer: true },
  { name: 'School Uniform Set', price: 2500, originalPrice: null, category: 'kids-clothing', description: 'Complete school uniform set.', metadata: { size: 'M', color: 'Navy' } },
  { name: 'Kids Winter Jacket', price: 3200, originalPrice: 4000, category: 'kids-clothing', description: 'Warm winter jacket for children.', metadata: { size: 'L', color: 'Red' }, isFeatured: true },
  
  // Home & Garden - Furniture (4)
  { name: 'Modern Coffee Table', price: 15000, originalPrice: 18000, category: 'furniture', description: 'Stylish coffee table with wooden top.', metadata: { material: 'Wood', dimensions: '120x60x45 cm' }, isBestOffer: true },
  { name: 'Office Chair Ergonomic', price: 12500, originalPrice: null, category: 'furniture', description: 'Comfortable ergonomic office chair.', metadata: { material: 'Mesh & Metal', dimensions: '65x65x120 cm' }, isFeatured: true },
  { name: 'Bookshelf 5-Tier', price: 8500, originalPrice: 10000, category: 'furniture', description: '5-tier bookshelf for storage.', metadata: { material: 'Engineered Wood', dimensions: '80x30x180 cm' } },
  { name: 'Dining Table Set', price: 45000, originalPrice: 55000, category: 'furniture', description: '6-seater dining table with chairs.', metadata: { material: 'Solid Wood', dimensions: '180x90x75 cm' }, isNewOffer: true },
  
  // Home & Garden - Kitchen (4)
  { name: 'Non-Stick Pan Set', price: 3500, originalPrice: 4500, category: 'kitchen', description: '3-piece non-stick pan set.', metadata: { material: 'Aluminum' }, isBestOffer: true },
  { name: 'Electric Kettle 1.5L', price: 1800, originalPrice: null, category: 'kitchen', description: 'Fast boiling electric kettle.', metadata: { material: 'Stainless Steel' } },
  { name: 'Knife Set 7-Piece', price: 5500, originalPrice: 7000, category: 'kitchen', description: 'Professional kitchen knife set.', metadata: { material: 'German Steel' }, isNewOffer: true },
  { name: 'Blender 750W', price: 4200, originalPrice: 5000, category: 'kitchen', description: 'Powerful blender for smoothies.', metadata: { material: 'BPA-Free Plastic' } },
  
  // Home & Garden - Garden Tools (2)
  { name: 'Garden Tool Set', price: 2800, originalPrice: 3500, category: 'garden-tools', description: '5-piece garden tool set.', metadata: { material: 'Steel & Wood' }, isBestOffer: true },
  { name: 'Hose Pipe 30m', price: 1500, originalPrice: null, category: 'garden-tools', description: 'Durable garden hose pipe.', metadata: { material: 'PVC' } },
  
  // Sports - Fitness (4)
  { name: 'Yoga Mat Premium', price: 1500, originalPrice: 2000, category: 'fitness', description: 'Non-slip yoga mat with carrying strap.', metadata: {}, isBestOffer: true },
  { name: 'Dumbbell Set 20kg', price: 5500, originalPrice: null, category: 'fitness', description: 'Adjustable dumbbell set.', metadata: {}, isFeatured: true },
  { name: 'Resistance Bands Set', price: 999, originalPrice: 1299, category: 'fitness', description: '5-piece resistance bands set.', metadata: {}, isNewOffer: true },
  { name: 'Fitness Tracker Watch', price: 4500, originalPrice: 6000, category: 'fitness', description: 'Smart fitness tracking watch.', metadata: {} },
  
  // Sports - Outdoor (3)
  { name: 'Camping Tent 4-Person', price: 8500, originalPrice: 10000, category: 'outdoor-gear', description: 'Waterproof camping tent.', metadata: {}, isFeatured: true },
  { name: 'Hiking Backpack 50L', price: 4500, originalPrice: null, category: 'outdoor-gear', description: 'Large capacity hiking backpack.', metadata: {} },
  { name: 'Sleeping Bag', price: 2500, originalPrice: 3000, category: 'outdoor-gear', description: 'Warm sleeping bag for camping.', metadata: {}, isBestOffer: true },
  
  // Arts & Crafts - Adhesives (3)
  { name: 'Double-Sided Sticky Tape 10mm x 25m', price: 1022, originalPrice: 1299, category: 'adhesives-tapes', description: 'High quality double-sided tape for crafts.', metadata: { length: '25m', width: '10mm', ageGroup: 'All Ages' }, isBestOffer: true },
  { name: 'Clear Tape 40m 2-Pack', price: 766, originalPrice: null, category: 'adhesives-tapes', description: 'Transparent tape for general use.', metadata: { length: '40m', width: '18mm', ageGroup: 'All Ages' } },
  { name: 'Red Liner Double Sided Clear Tape', price: 1022, originalPrice: 1299, category: 'adhesives-tapes', description: 'Premium red liner tape for precision crafts.', metadata: { length: '30m', width: '12mm', ageGroup: 'Adults' }, isNewOffer: true },
  
  // Arts & Crafts - Paints (2)
  { name: 'Acrylic Paint Set 24 Colors', price: 1800, originalPrice: 2200, category: 'paints-brushes', description: 'Vibrant acrylic paints for art projects.', metadata: { ageGroup: 'All Ages' }, isFeatured: true },
  { name: 'Brush Set 15-Piece', price: 999, originalPrice: null, category: 'paints-brushes', description: 'Assorted paint brushes for various techniques.', metadata: { ageGroup: 'All Ages' } },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Announcement.deleteMany({});
    console.log('✓ Cleared existing categories, products, and announcements');
    
    // Create categories
    console.log('Creating categories...');
    const categoryMap = {};
    
    // First pass: create root categories
    for (const cat of categoriesData.filter(c => !c.parentSlug)) {
      const category = await Category.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        parent: null,
        attributes: cat.attributes || []
      });
      categoryMap[cat.slug] = category._id;
    }
    
    // Second pass: create sub-categories
    for (const cat of categoriesData.filter(c => c.parentSlug)) {
      const parentId = categoryMap[cat.parentSlug];
      const category = await Category.create({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        parent: parentId,
        attributes: cat.attributes || []
      });
      categoryMap[cat.slug] = category._id;
    }
    
    console.log(`✓ Created ${Object.keys(categoryMap).length} categories`);
    
    // Create products
    console.log('Creating products...');
    let productCount = 0;
    
    // Map category slugs to image arrays
    const categoryImageMap = {
      'phones': productImages.phones,
      'laptops': productImages.laptops,
      'electronics-accessories': productImages.accessories,
      'mens-clothing': productImages.mens,
      'womens-clothing': productImages.womens,
      'kids-clothing': productImages.kids,
      'furniture': productImages.furniture,
      'kitchen': productImages.kitchen,
      'garden-tools': productImages.garden,
      'fitness': productImages.fitness,
      'outdoor-gear': productImages.outdoor,
      'adhesives-tapes': productImages.crafts,
      'paints-brushes': productImages.crafts
    };
    
    // Track image usage per category to cycle through images
    const imageIndex = {};
    
    for (const prod of productsData) {
      const categoryId = categoryMap[prod.category];
      if (!categoryId) {
        console.log(`  ⚠ Skipping product "${prod.name}" - category "${prod.category}" not found`);
        continue;
      }
      
      // Convert metadata object to Map
      const metadataMap = new Map();
      if (prod.metadata) {
        Object.entries(prod.metadata).forEach(([key, value]) => {
          metadataMap.set(key, value);
        });
      }
      
      // Get appropriate image for this category
      const categoryImages = categoryImageMap[prod.category] || productImages.accessories;
      if (!imageIndex[prod.category]) {
        imageIndex[prod.category] = 0;
      }
      const image = categoryImages[imageIndex[prod.category] % categoryImages.length];
      imageIndex[prod.category]++;
      
      await Product.create({
        name: prod.name,
        slug: prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now() + Math.random().toString(36).substr(2, 5),
        description: prod.description,
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        stock: Math.floor(Math.random() * 100) + 10,
        category: categoryId,
        metadata: metadataMap,
        isActive: true,
        isNewOffer: prod.isNewOffer || false,
        isBestOffer: prod.isBestOffer || false,
        isFeatured: prod.isFeatured || false,
        images: [image]
      });
      
      productCount++;
    }
    
    console.log(`✓ Created ${productCount} products`);
    
    // Create announcements
    console.log('Creating announcements...');
    for (const announcement of announcementsData) {
      await Announcement.create(announcement);
    }
    console.log(`✓ Created ${announcementsData.length} announcements`);
    
    console.log('\n========================================');
    console.log('✓ Seed completed successfully!');
    console.log('========================================');
    console.log('\nSummary:');
    console.log(`  - Categories: ${Object.keys(categoryMap).length}`);
    console.log(`  - Products: ${productCount}`);
    console.log(`  - Announcements: ${announcementsData.length}`);
    console.log('\nYou can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('✗ Seed failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  }
}

// Run seed
seed();
