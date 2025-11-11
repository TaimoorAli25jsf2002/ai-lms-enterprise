// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  
  // User Role
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  
  // Student Profile Info
  age: {
    type: Number,
    min: 5,
    max: 18
  },
  grade: {
    type: String
  },
  avatar: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random&color=fff&size=200`;
    }
  },
  
  // Gamification
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    name: String,
    icon: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Learning Data
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  completedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Streak Tracking
  streak: {
    count: {
      type: Number,
      default: 0
    },
    lastActive: Date,
    longestStreak: {
      type: Number,
      default: 0
    }
  },
  
  // Subscription & Payment
  subscription: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trial'],
    default: 'trial'
  },
  stripeCustomerId: String,
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date
  
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to update streak
userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = this.streak.lastActive ? new Date(this.streak.lastActive) : null;
  
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      this.streak.count += 1;
      if (this.streak.count > this.streak.longestStreak) {
        this.streak.longestStreak = this.streak.count;
      }
    } else if (diffDays > 1) {
      // Streak broken
      this.streak.count = 1;
    }
    // If diffDays === 0, same day, don't change streak
  } else {
    // First time
    this.streak.count = 1;
    this.streak.longestStreak = 1;
  }
  
  this.streak.lastActive = new Date();
};

// Method to add points and level up
userSchema.methods.addPoints = function(points) {
  this.points += points;
  
  // Level up calculation (every 100 points = 1 level)
  const newLevel = Math.floor(this.points / 100) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    return { leveledUp: true, newLevel };
  }
  
  return { leveledUp: false, newLevel: this.level };
};

// Method to add badge
userSchema.methods.addBadge = function(badge) {
  // Check if badge already exists
  const exists = this.badges.some(b => b.name === badge.name);
  if (!exists) {
    this.badges.push(badge);
    return true;
  }
  return false;
};

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ points: -1 });

module.exports = mongoose.model('User', userSchema);