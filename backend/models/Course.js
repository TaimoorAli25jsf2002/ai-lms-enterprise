// backend/models/Course.js
const mongoose = require('mongoose');

// Lesson Schema (Embedded in Module)
const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['video', 'text', 'interactive', 'quiz', 'ai-playground', 'exercise'],
    default: 'text'
  },
  content: String, // Markdown content or instructions
  videoUrl: String, // YouTube or video URL
  duration: {
    type: Number, // in minutes
    default: 10
  },
  order: {
    type: Number,
    required: true
  },
  
  // For AI Playground lessons
  aiPlayground: {
    type: {
      type: String,
      enum: ['image-classifier', 'sentiment-analyzer', 'chatbot', 'drawing-recognition', 'code-editor']
    },
    config: mongoose.Schema.Types.Mixed
  },
  
  // For Exercise/Game lessons
  exercise: {
    type: {
      type: String,
      enum: ['drag-drop', 'matching', 'fill-blank', 'coding', 'puzzle']
    },
    data: mongoose.Schema.Types.Mixed // Exercise-specific data
  },
  
  // Resources
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'video', 'code']
    }
  }],
  
  isLocked: {
    type: Boolean,
    default: false
  },
  requiredPoints: {
    type: Number,
    default: 0
  }
});

// Module Schema (Embedded in Course)
const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  icon: String, // Emoji or icon code
  lessons: [lessonSchema],
  
  // Module completion requirements
  passingScore: {
    type: Number,
    default: 70
  }
});

// Main Course Schema
const courseSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  thumbnail: {
    type: String,
    default: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
  },
  
  // Classification
  category: {
    type: String,
    enum: ['AI Basics', 'Machine Learning', 'Neural Networks', 'Computer Vision', 'NLP', 'Robotics', 'Ethics', 'Deep Learning'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  ageGroup: {
    type: String,
    enum: ['5-7', '8-10', '11-13', '14-16', '17+'],
    required: true
  },
  
  // Course Content
  modules: [moduleSchema],
  
  // Instructor
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Students
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Ratings & Reviews
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Course Stats
  totalLessons: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  
  // Tags & Keywords
  tags: [String],
  skills: [String], // Skills students will learn
  
  // Requirements & Prerequisites
  prerequisites: [String],
  requirements: [String], // What students need before starting
  
  // Course Status
  isPublished: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    default: 0
  },
  
  // Subscription Requirements
  requiredPlan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  
  // Featured
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredOrder: Number
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from title before saving
courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  // Calculate total lessons and duration
  let totalLessons = 0;
  let totalDuration = 0;
  
  this.modules.forEach(module => {
    totalLessons += module.lessons.length;
    module.lessons.forEach(lesson => {
      totalDuration += lesson.duration || 0;
    });
  });
  
  this.totalLessons = totalLessons;
  this.totalDuration = totalDuration;
  
  next();
});

// Virtual for enrollment count
courseSchema.virtual('enrollmentCount').get(function() {
  return this.enrolledStudents.length;
});

// Method to calculate and update rating
courseSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating.average = (sum / this.reviews.length).toFixed(1);
  this.rating.count = this.reviews.length;
};

// Static method to get popular courses
courseSchema.statics.getPopularCourses = function(limit = 10) {
  return this.find({ isPublished: true })
    .sort({ 'enrolledStudents': -1, 'rating.average': -1 })
    .limit(limit);
};

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, difficulty: 1 });
courseSchema.index({ isPublished: 1, isFeatured: 1 });
courseSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Course', courseSchema);