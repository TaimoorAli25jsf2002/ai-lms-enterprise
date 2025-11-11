// backend/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', leaderboardController.getGlobalLeaderboard);
router.get('/top', leaderboardController.getTopPerformers);
router.get('/stats', leaderboardController.getLeaderboardStats);

// Protected routes
router.get('/user/:userId', protect, leaderboardController.getUserRank);
router.put('/update', protect, leaderboardController.updateLeaderboard);

module.exports = router;