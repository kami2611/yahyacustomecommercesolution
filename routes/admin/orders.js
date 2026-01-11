const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const Newsletter = require('../../models/Newsletter');

// Export customer data for marketing
router.get('/export-customers', async (req, res) => {
  try {
    // Get unique customers from orders
    const orders = await Order.find({}, 'customer createdAt').lean();
    
    // Get newsletter subscribers
    const subscribers = await Newsletter.find({ isActive: true }, 'email createdAt').lean();
    
    // Create a map to deduplicate by email
    const customerMap = new Map();
    
    // Add order customers
    orders.forEach(order => {
      const email = order.customer.email.toLowerCase();
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          email: order.customer.email,
          fullName: order.customer.fullName,
          phone: order.customer.phone,
          phone2: order.customer.phone2 || '',
          city: order.customer.city,
          address: order.customer.address,
          source: 'order',
          firstOrderDate: order.createdAt
        });
      }
    });
    
    // Add newsletter subscribers (mark source)
    subscribers.forEach(sub => {
      const email = sub.email.toLowerCase();
      if (customerMap.has(email)) {
        customerMap.get(email).source = 'order+newsletter';
      } else {
        customerMap.set(email, {
          email: sub.email,
          fullName: '',
          phone: '',
          phone2: '',
          city: '',
          address: '',
          source: 'newsletter',
          firstOrderDate: sub.createdAt
        });
      }
    });
    
    const customers = Array.from(customerMap.values());
    
    // Generate CSV content
    const csvHeaders = ['Email', 'Full Name', 'Phone 1', 'Phone 2', 'City', 'Address', 'Source', 'First Contact Date'];
    const csvRows = customers.map(c => [
      c.email,
      c.fullName,
      c.phone,
      c.phone2,
      c.city,
      c.address.replace(/,/g, ' '), // Remove commas from address
      c.source,
      new Date(c.firstOrderDate).toLocaleDateString()
    ].map(field => `"${field}"`).join(','));
    
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error exporting customers:', error);
    res.status(500).json({ success: false, message: 'Error exporting customer data' });
  }
});

// List all orders
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;
    
    let filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.fullName': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get counts by status
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const counts = {
      all: totalOrders,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      'out-for-delivery': 0,
      delivered: 0,
      cancelled: 0
    };
    
    statusCounts.forEach(s => {
      counts[s._id] = s.count;
    });
    
    res.render('admin/orders/index', {
      title: 'Manage Orders',
      orders,
      counts,
      filters: { status: status || 'all', search: search || '' },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).render('error', { message: 'Error loading orders' });
  }
});

// View single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }
    
    res.render('admin/orders/view', {
      title: `Order ${order.orderNumber}`,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).render('error', { message: 'Error loading order' });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, note, trackingNumber, estimatedDelivery } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Add to status history
    order.statusHistory.push({
      status,
      note: note || `Status changed to ${status}`,
      updatedAt: new Date()
    });
    
    order.status = status;
    
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    if (estimatedDelivery) {
      order.estimatedDelivery = new Date(estimatedDelivery);
    }
    
    await order.save();
    
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: 'Error deleting order' });
  }
});

module.exports = router;
