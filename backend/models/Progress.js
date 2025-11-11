// ==================================================
// backend/models/Progress.js
// ==================================================
const mongoose = require('mongoose');

// Progress Schema - Tracks student progress in a course
const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },

  // Completed Lessons
  completedLessons: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    },
    score: Number, // For quizzes/exercises
    attempts: {
      type: Number,
      default: 1
    }
  }],

  // Overall Progress
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Current Position
  currentModule: {
    type: mongoose.Schema.Types.ObjectId
  },
  currentLesson: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Time Tracking
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,

  // Performance Metrics
  averageScore: {
    type: Number,
    default: 0
  },
  quizzesPassed: {
    type: Number,
    default: 0
  },
  quizzesFailed: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },

  // Certificate
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }

}, {
  timestamps: true
});

// Compound index for user-course combination
progressSchema.index({ user: 1, course: 1 }, { unique: true });

// Method to check if lesson is completed
progressSchema.methods.isLessonCompleted = function (moduleId, lessonId) {
  return this.completedLessons.some(
    lesson =>
      lesson.moduleId.toString() === moduleId.toString() &&
      lesson.lessonId.toString() === lessonId.toString()
  );
};

// Method to mark lesson as complete
progressSchema.methods.completeLesson = function (moduleId, lessonId, timeSpent = 0, score = null) {
  const existingIndex = this.completedLessons.findIndex(
    lesson =>
      lesson.moduleId.toString() === moduleId.toString() &&
      lesson.lessonId.toString() === lessonId.toString()
  );

  if (existingIndex !== -1) {
    this.completedLessons[existingIndex].attempts += 1;
    if (score !== null) {
      this.completedLessons[existingIndex].score = score;
    }
    return false; // Already completed
  } else {
    this.completedLessons.push({
      moduleId,
      lessonId,
      completedAt: new Date(),
      timeSpent,
      score,
      attempts: 1
    });

    this.totalTimeSpent += timeSpent;
    return true; // Newly completed
  }
};

// Method to calculate overall progress
progressSchema.methods.calculateProgress = async function () {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);

  if (!course) return 0;

  const totalLessons = course.totalLessons;
  if (totalLessons === 0) return 0;

  const completedCount = this.completedLessons.length;
  const progress = Math.round((completedCount / totalLessons) * 100);

  this.overallProgress = progress;

  // Update status
  if (progress === 0) {
    this.status = 'not-started';
  } else if (progress === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else {
    this.status = 'in-progress';
  }

  return progress;
};

// Method to get next lesson
progressSchema.methods.getNextLesson = async function () {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);

  if (!course) return null;

  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      const isCompleted = this.isLessonCompleted(module._id, lesson._id);
      if (!isCompleted) {
        return {
          moduleId: module._id,
          lessonId: lesson._id,
          moduleTitle: module.title,
          lessonTitle: lesson.title
        };
      }
    }
  }

  return null; // All lessons completed
};

const Progress = mongoose.model('Progress', progressSchema);
module.exports = Progress;
