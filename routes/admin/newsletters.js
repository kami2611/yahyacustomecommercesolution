const express = require('express');
const router = express.Router();
const Newsletter = require('../../models/Newsletter');

// List all newsletter subscriptions
router.get('/', async (req, res) => {
  try {
    const { status = 'all', search = '', page = 1 } = req.query;
    const limit = 20;
    const skip = (parseInt(page) - 1) * limit;
    
    let filter = {};
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }
    
    const total = await Newsletter.countDocuments(filter);
    const subscribers = await Newsletter.find(filter)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const stats = {
      total: await Newsletter.countDocuments(),
      active: await Newsletter.countDocuments({ isActive: true }),
      inactive: await Newsletter.countDocuments({ isActive: false })
    };
    
    res.render('admin/newsletters/index', {
      title: 'Newsletter Subscribers',
      subscribers,
      stats,
      filters: { status, search },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error loading newsletter subscribers:', error);
    res.status(500).render('error', { message: 'Error loading subscribers' });
  }
});

// Add new subscriber manually
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if email already exists
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (!existing.isActive) {
        // Reactivate the subscription
        existing.isActive = true;
        existing.unsubscribedAt = null;
        await existing.save();
      }
      return res.redirect('/admin/newsletters?message=exists');
    }
    
    const subscriber = new Newsletter({
      email: email.toLowerCase(),
      source: 'admin'
    });
    
    await subscriber.save();
    res.redirect('/admin/newsletters?message=added');
  } catch (error) {
    console.error('Error adding subscriber:', error);
    res.redirect('/admin/newsletters?error=add');
  }
});

// Toggle subscriber status
router.post('/:id/toggle', async (req, res) => {
  try {
    const subscriber = await Newsletter.findById(req.params.id);
    if (subscriber) {
      subscriber.isActive = !subscriber.isActive;
      subscriber.unsubscribedAt = subscriber.isActive ? null : new Date();
      await subscriber.save();
    }
    res.redirect('/admin/newsletters');
  } catch (error) {
    console.error('Error toggling subscriber:', error);
    res.redirect('/admin/newsletters?error=toggle');
  }
});

// Delete subscriber
router.delete('/:id', async (req, res) => {
  try {
    await Newsletter.findByIdAndDelete(req.params.id);
    res.redirect('/admin/newsletters');
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.redirect('/admin/newsletters?error=delete');
  }
});

// Export subscribers as CSV
router.get('/export', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    let filter = {};
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    
    const subscribers = await Newsletter.find(filter).sort({ subscribedAt: -1 });
    
    // Create CSV content
    let csv = 'Email,Status,Subscribed Date,Source\n';
    subscribers.forEach(sub => {
      csv += `"${sub.email}","${sub.isActive ? 'Active' : 'Inactive'}","${sub.subscribedAt.toISOString()}","${sub.source}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=newsletter-subscribers-${status}-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting subscribers:', error);
    res.redirect('/admin/newsletters?error=export');
  }
});

module.exports = router;
