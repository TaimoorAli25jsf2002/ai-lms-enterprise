// backend/controllers/leaderboardController.js
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

// @route   GET /api/leaderboard
// @desc    Get global leaderboard
// @access  Public
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 50, timeframe = 'all' } = req.query;

    let sortField = 'totalPoints';
    
    if (timeframe === 'weekly') {
      sortField = 'weeklyPoints';
    } else if (timeframe === 'monthly') {
      sortField = 'monthlyPoints';
    }

    const leaderboard = await Leaderboard.find()
      .populate('user', 'name avatar level')
      .sort(`-${sortField}`)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: (page - 1) * limit + index + 1,
      user: entry.user,
      points: entry[sortField],
      totalPoints: entry.totalPoints,
      coursesCompleted: entry.coursesCompleted,
      currentStreak: entry.currentStreak,
      longestStreak: entry.longestStreak
    }));

    const count = await Leaderboard.countDocuments();

    res.json({ 
      success: true, 
      leaderboard: rankedLeaderboard,
      timeframe,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/leaderboard/user/:userId
// @desc    Get user's leaderboard position
// @access  Private
exports.getUserRank = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const userLeaderboard = await Leaderboard.findOne({ user: userId })
      .populate('user', 'name avatar level');

    if (!userLeaderboard) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found in leaderboard' 
      });
    }

    // Calculate global rank
    const globalRank = await Leaderboard.countDocuments({
      totalPoints: { $gt: userLeaderboard.totalPoints }
    }) + 1;

    // Calculate weekly rank
    const weeklyRank = await Leaderboard.countDocuments({
      weeklyPoints: { $gt: userLeaderboard.weeklyPoints }
    }) + 1;

    // Get nearby users (5 above, 5 below)
    const nearbyUsers = await Leaderboard.find({
      totalPoints: {
        $gte: userLeaderboard.totalPoints - 500,
        $lte: userLeaderboard.totalPoints + 500
      }
    })
      .populate('user', 'name avatar level')
      .sort('-totalPoints')
      .limit(11);

    res.json({ 
      success: true, 
      userRank: {
        ...userLeaderboard.toObject(),
        globalRank,
        weeklyRank
      },
      nearbyUsers
    });

  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/leaderboard/top
// @desc    Get top performers
// @access  Public
exports.getTopPerformers = async (req, res) => {
  try {
    const { limit = 10, category = 'points' } = req.query;

    let sortField = 'totalPoints';
    
    switch (category) {
      case 'courses':
        sortField = 'coursesCompleted';
        break;
      case 'streak':
        sortField = 'longestStreak';
        break;
      case 'quizzes':
        sortField = 'quizzesPassed';
        break;
      default:
        sortField = 'totalPoints';
    }

    const topUsers = await Leaderboard.find()
      .populate('user', 'name avatar level badges')
      .sort(`-${sortField}`)
      .limit(parseInt(limit));

    const rankedUsers = topUsers.map((entry, index) => ({
      rank: index + 1,
      user: entry.user,
      score: entry[sortField],
      ...entry.toObject()
    }));

    res.json({ 
      success: true, 
      category,
      topPerformers: rankedUsers
    });

  } catch (error) {
    console.error('Get top performers error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   PUT /api/leaderboard/update
// @desc    Update user's leaderboard stats
// @access  Private
exports.updateLeaderboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update or create leaderboard entry
    let leaderboard = await Leaderboard.findOne({ user: req.user.id });

    if (leaderboard) {
      leaderboard.totalPoints = user.points;
      leaderboard.coursesCompleted = user.completedCourses.length;
      leaderboard.coursesInProgress = user.enrolledCourses.length - user.completedCourses.length;
      leaderboard.currentStreak = user.streak.count;
      leaderboard.longestStreak = user.streak.longestStreak;
      leaderboard.lastUpdated = new Date();
    } else {
      leaderboard = await Leaderboard.create({
        user: req.user.id,
        totalPoints: user.points,
        coursesCompleted: user.completedCourses.length,
        coursesInProgress: user.enrolledCourses.length - user.completedCourses.length,
        currentStreak: user.streak.count,
        longestStreak: user.streak.longestStreak
      });
    }

    await leaderboard.save();

    // Calculate rank
    const rank = await Leaderboard.countDocuments({
      totalPoints: { $gt: leaderboard.totalPoints }
    }) + 1;

    leaderboard.globalRank = rank;
    await leaderboard.save();

    res.json({ 
      success: true, 
      leaderboard,
      message: 'Leaderboard updated successfully' 
    });

  } catch (error) {
    console.error('Update leaderboard error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/leaderboard/stats
// @desc    Get leaderboard statistics
// @access  Public
exports.getLeaderboardStats = async (req, res) => {
  try {
    const totalUsers = await Leaderboard.countDocuments();
    
    const topScorer = await Leaderboard.findOne()
      .populate('user', 'name avatar')
      .sort('-totalPoints')
      .limit(1);

    const longestStreaker = await Leaderboard.findOne()
      .populate('user', 'name avatar')
      .sort('-longestStreak')
      .limit(1);

    const mostCourses = await Leaderboard.findOne()
      .populate('user', 'name avatar')
      .sort('-coursesCompleted')
      .limit(1);

    const avgPoints = await Leaderboard.aggregate([
      { $group: { _id: null, average: { $avg: '$totalPoints' } } }
    ]);

    const stats = {
      totalUsers,
      averagePoints: avgPoints[0]?.average || 0,
      topScorer: topScorer ? {
        user: topScorer.user,
        points: topScorer.totalPoints
      } : null,
      longestStreaker: longestStreaker ? {
        user: longestStreaker.user,
        streak: longestStreaker.longestStreak
      } : null,
      mostCourses: mostCourses ? {
        user: mostCourses.user,
        courses: mostCourses.coursesCompleted
      } : null
    };

    res.json({ 
      success: true, 
      stats 
    });

  } catch (error) {
    console.error('Get leaderboard stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = exports;