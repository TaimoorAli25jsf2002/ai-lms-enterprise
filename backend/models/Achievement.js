// ==================================================
// backend/models/Achievement.js
// ==================================================
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏆'
  },
  
  // Category
  category: {
    type: String,
    enum: ['learning', 'social', 'streak', 'quiz', 'completion', 'special'],
    default: 'learning'
  },
  
  // Reward
  points: {
    type: Number,
    default: 0
  },
  
  // Rarity
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  // Criteria for earning
  criteria: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Display
  color: String,
  isHidden: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Achievement = mongoose.model('Achievement', achievementSchema);
module.exports = Achievement;
