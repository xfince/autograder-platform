const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['task-assigned', 'task-updated', 'task-completed', 'comment-added', 'due-date-reminder'],
    required: true
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // Auto-delete after 30 days
  }
}, {
  timestamps: true
});

// Create indexes
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = Date.now();
  await this.save();
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ user: userId, isRead: false });
};

module.exports = mongoose.model('Notification', NotificationSchema);