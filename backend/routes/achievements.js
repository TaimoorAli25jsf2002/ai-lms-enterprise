// backend/routes/achievements.js
const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', achievementController.getAllAchievements);

// Protected routes
router.get('/user/:userId', protect, achievementController.getUserAchievements);
router.post('/check', protect, achievementController.checkAndAwardAchievements);
router.get('/stats', protect, achievementController.getAchievementStats);

// Admin routes
router.post('/create', protect, authorize('admin'), achievementController.createAchievement);

module.exports = router;