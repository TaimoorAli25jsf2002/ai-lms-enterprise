// backend/controllers/notificationController.js
const Notification = require('../models/Notification');

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let query = { user: req.user.id };
    
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });

    res.json({ 
      success: true, 
      notifications,
      unreadCount,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found' 
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ 
      success: true, 
      notification,
      message: 'Notification marked as read' 
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ 
      success: true, 
      count: result.modifiedCount,
      message: `Marked ${result.modifiedCount} notification(s) as read` 
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Notification deleted' 
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   DELETE /api/notifications/clear-all
// @desc    Delete all user notifications
// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ 
      user: req.user.id 
    });

    res.json({ 
      success: true, 
      count: result.deletedCount,
      message: `Deleted ${result.deletedCount} notification(s)` 
    });

  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/notifications/create
// @desc    Create notification (System/Admin)
// @access  Private/Admin
exports.createNotification = async (req, res) => {
  try {
    const {
      user,
      title,
      message,
      type,
      link,
      icon,
      priority
    } = req.body;

    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      link,
      icon,
      priority
    });

    res.status(201).json({ 
      success: true, 
      notification,
      message: 'Notification created successfully' 
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });

    res.json({ 
      success: true, 
      count 
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = exports;