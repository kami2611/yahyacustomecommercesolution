const express = require('express');
const router = express.Router();
const Announcement = require('../../models/Announcement');

// List announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort('order');
    res.render('admin/announcements/index', {
      title: 'Manage Announcements',
      announcements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).render('error', { message: 'Error loading announcements' });
  }
});

// Create announcement
router.post('/', async (req, res) => {
  try {
    const { text, isActive, order } = req.body;
    
    // Check if already have 5 announcements
    const count = await Announcement.countDocuments();
    if (count >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 announcements allowed' });
    }
    
    const announcement = await Announcement.create({
      text,
      isActive: isActive === 'on' || isActive === true,
      order: order || count
    });
    
    res.redirect('/admin/announcements');
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).render('error', { message: 'Error creating announcement' });
  }
});

// Update announcement
router.put('/:id', async (req, res) => {
  try {
    const { text, isActive, order } = req.body;
    
    await Announcement.findByIdAndUpdate(req.params.id, {
      text,
      isActive: isActive === 'on' || isActive === true || isActive === 'true',
      order: order || 0
    });
    
    res.redirect('/admin/announcements');
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).render('error', { message: 'Error updating announcement' });
  }
});

// Delete announcement
router.delete('/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.redirect('/admin/announcements');
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).render('error', { message: 'Error deleting announcement' });
  }
});

module.exports = router;
