const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: {
    type: Number,
    required: true
  },
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: String
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'Cash on Delivery'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedAt: { type: Date, default: Date.now }
  }],
  notes: String,
  trackingNumber: String,
  estimatedDelivery: Date
}, {
  timestamps: true
});

// Generate order number
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Get order by order number (for tracking)
orderSchema.statics.findByOrderNumber = function(orderNumber) {
  return this.findOne({ orderNumber: orderNumber.toUpperCase() });
};

// Get status display text
orderSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    'pending': 'Order Placed',
    'confirmed': 'Order Confirmed',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'out-for-delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
};

// Get status step (for progress bar)
orderSchema.methods.getStatusStep = function() {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];
  return steps.indexOf(this.status);
};

module.exports = mongoose.model('Order', orderSchema);
