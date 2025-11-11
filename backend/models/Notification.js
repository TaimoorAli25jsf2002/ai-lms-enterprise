// ==================================================
// backend/models/Notification.js
// ==================================================
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Type
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'achievement', 'course', 'payment', 'system'],
    default: 'info'
  },
  
  // Status
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Action
  link: String,
  actionText: String,
  
  // Display
  icon: String,
  color: String,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Metadata
  data: mongoose.Schema.Types.Mixed,
  
  // Expiry
  expiresAt: Date
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports =  Notification;