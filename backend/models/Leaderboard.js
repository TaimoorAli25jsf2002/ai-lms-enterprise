// ==================================================
// backend/models/Leaderboard.js
// ==================================================
const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Points
  totalPoints: {
    type: Number,
    default: 0
  },
  weeklyPoints: {
    type: Number,
    default: 0
  },
  monthlyPoints: {
    type: Number,
    default: 0
  },
  
  // Courses
  coursesCompleted: {
    type: Number,
    default: 0
  },
  coursesInProgress: {
    type: Number,
    default: 0
  },
  
  // Quizzes
  quizzesPassed: {
    type: Number,
    default: 0
  },
  quizzesFailed: {
    type: Number,
    default: 0
  },
  averageQuizScore: {
    type: Number,
    default: 0
  },
  
  // Streak
  longestStreak: {
    type: Number,
    default: 0
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  
  // Rank
  globalRank: Number,
  weeklyRank: Number,
  monthlyRank: Number,
  
  // Last Updated
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

leaderboardSchema.index({ totalPoints: -1 });
leaderboardSchema.index({ weeklyPoints: -1 });

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
module.exports = Leaderboard;