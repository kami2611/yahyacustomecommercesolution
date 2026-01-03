const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

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
