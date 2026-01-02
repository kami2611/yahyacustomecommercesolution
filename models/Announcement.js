const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to get active announcements
announcementSchema.statics.getActiveAnnouncements = async function() {
  return this.find({ isActive: true })
    .sort('order')
    .limit(5);
};

module.exports = mongoose.model('Announcement', announcementSchema);
