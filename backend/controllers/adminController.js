// backend/controllers/adminController.js
const User = require('../models/User');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { Progress } = require('../models/Progress');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // User stats
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const activeUsers = await User.countDocuments({
      'streak.lastActive': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    // Course stats
    const totalCourses = await Course.countDocuments();
    const publishedCourses = await Course.countDocuments({ isPublished: true });
    
    const enrollmentData = await Course.aggregate([
      { $project: { count: { $size: '$enrolledStudents' } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);

    // Revenue stats
    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          monthly: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // Progress stats
    const avgProgress = await Progress.aggregate([
      { $group: { _id: null, avg: { $avg: '$overallProgress' } } }
    ]);

    // Top courses
    const topCourses = await Course.find()
      .select('title enrolledStudents thumbnail category')
      .sort({ 'enrolledStudents': -1 })
      .limit(5)
      .lean();

    // Recent users
    const recentUsers = await User.find()
      .select('name email avatar createdAt')
      .sort('-createdAt')
      .limit(10);

    // User growth chart data
    const userGrowth = await User.aggregate([
      {
        $match: { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 6)) } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Revenue trend
    const revenueTrend = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
          growth: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : 0
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          enrollments: enrollmentData[0]?.total || 0
        },
        revenue: {
          total: revenueData[0]?.total || 0,
          monthly: revenueData[0]?.monthly || 0,
          subscriptions: activeSubscriptions
        },
        performance: {
          avgProgress: avgProgress[0]?.avg || 0,
          completionRate: 75 // Calculate from actual data
        }
      },
      charts: { userGrowth, revenueTrend },
      topCourses: topCourses.map(c => ({
        ...c,
        enrollments: c.enrolledStudents.length
      })),
      recentUsers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .populate('enrolledCourses', 'title')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id && req.body.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Cannot change your own admin role' 
      });
    }

    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Cannot delete your own account' 
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
  try {
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const coursesByCategory = await Course.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const revenueByPlan = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$plan', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      analytics: {
        usersByRole,
        coursesByCategory,
        revenueByPlan
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;