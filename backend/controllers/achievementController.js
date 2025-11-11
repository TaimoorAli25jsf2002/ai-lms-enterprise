// backend/controllers/achievementController.js
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   GET /api/achievements
// @desc    Get all available achievements
// @access  Public
exports.getAllAchievements = async (req, res) => {
  try {
    const { category, rarity } = req.query;

    let query = { isHidden: false };
    
    if (category) query.category = category;
    if (rarity) query.rarity = rarity;

    const achievements = await Achievement.find(query).sort('rarity points');

    res.json({ 
      success: true, 
      count: achievements.length,
      achievements 
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/achievements/user/:userId
// @desc    Get user's earned achievements
// @access  Private
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const user = await User.findById(userId).select('badges');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      count: user.badges.length,
      achievements: user.badges 
    });

  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/achievements/check
// @desc    Check and award achievements to user
// @access  Private
exports.checkAndAwardAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('enrolledCourses')
      .populate('completedCourses');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const newAchievements = [];

    // Define achievement criteria and check
    const achievementChecks = [
      {
        name: 'First Steps',
        icon: '👣',
        description: 'Enrolled in your first course',
        category: 'learning',
        points: 10,
        rarity: 'common',
        check: () => user.enrolledCourses.length >= 1
      },
      {
        name: 'Course Master',
        icon: '🎓',
        description: 'Completed your first course',
        category: 'completion',
        points: 50,
        rarity: 'rare',
        check: () => user.completedCourses.length >= 1
      },
      {
        name: 'Perfect Score',
        icon: '💯',
        description: 'Scored 100% on a quiz',
        category: 'quiz',
        points: 30,
        rarity: 'epic',
        check: () => false // Would check quiz scores
      },
      {
        name: 'Week Warrior',
        icon: '🔥',
        description: '7 day learning streak',
        category: 'streak',
        points: 25,
        rarity: 'rare',
        check: () => user.streak.count >= 7
      },
      {
        name: 'Century Club',
        icon: '💪',
        description: 'Reached 100 points',
        category: 'learning',
        points: 20,
        rarity: 'common',
        check: () => user.points >= 100
      },
      {
        name: 'AI Enthusiast',
        icon: '🤖',
        description: 'Completed 3 courses',
        category: 'completion',
        points: 100,
        rarity: 'epic',
        check: () => user.completedCourses.length >= 3
      },
      {
        name: 'Rising Star',
        icon: '⭐',
        description: 'Reached Level 5',
        category: 'learning',
        points: 50,
        rarity: 'rare',
        check: () => user.level >= 5
      },
      {
        name: 'Dedication',
        icon: '🏆',
        description: '30 day learning streak',
        category: 'streak',
        points: 100,
        rarity: 'legendary',
        check: () => user.streak.count >= 30
      }
    ];

    // Check each achievement
    for (const achievement of achievementChecks) {
      const alreadyHas = user.badges.some(b => b.name === achievement.name);
      
      if (!alreadyHas && achievement.check()) {
        // Award achievement
        const badge = {
          name: achievement.name,
          icon: achievement.icon,
          description: achievement.description
        };

        const added = user.addBadge(badge);
        
        if (added) {
          user.addPoints(achievement.points);
          newAchievements.push(achievement);

          // Create notification
          await Notification.create({
            user: user._id,
            title: 'Achievement Unlocked! 🎉',
            message: `You earned "${achievement.name}" - ${achievement.description}`,
            type: 'achievement',
            icon: achievement.icon,
            data: achievement
          });
        }
      }
    }

    await user.save();

    res.json({ 
      success: true, 
      newAchievements,
      totalAchievements: user.badges.length,
      message: newAchievements.length > 0 
        ? `Congratulations! You unlocked ${newAchievements.length} new achievement(s)!` 
        : 'Keep going! More achievements await!'
    });

  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/achievements/create
// @desc    Create new achievement (Admin only)
// @access  Private/Admin
exports.createAchievement = async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      category,
      points,
      rarity,
      criteria,
      color
    } = req.body;

    const achievement = await Achievement.create({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      icon,
      category,
      points,
      rarity,
      criteria,
      color
    });

    res.status(201).json({ 
      success: true, 
      achievement,
      message: 'Achievement created successfully!' 
    });

  } catch (error) {
    console.error('Create achievement error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/achievements/stats
// @desc    Get achievement statistics
// @access  Private
exports.getAchievementStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const totalAchievements = await Achievement.countDocuments({ isHidden: false });

    const stats = {
      earned: user.badges.length,
      total: totalAchievements,
      percentage: ((user.badges.length / totalAchievements) * 100).toFixed(1),
      byCategory: {},
      byRarity: {}
    };

    // Count by category
    user.badges.forEach(badge => {
      const category = badge.category || 'other';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    // Count by rarity
    user.badges.forEach(badge => {
      const rarity = badge.rarity || 'common';
      stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
    });

    res.json({ 
      success: true, 
      stats 
    });

  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = exports;