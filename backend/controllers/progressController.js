// ==================================================
// FILE 15: backend/controllers/progressController.js
// ==================================================
const { Progress } = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Certificate = require('../models/Certificate');
const Leaderboard = require('../models/Leaderboard');

// Get course progress
exports.getCourseProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      user: req.user.id,
      course: req.params.courseId
    }).populate('course', 'title thumbnail totalLessons');

    if (!progress) {
      return res.status(404).json({ 
        success: false,
        message: 'Progress not found' 
      });
    }

    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete a lesson
exports.completeLesson = async (req, res) => {
  try {
    const { courseId, moduleId, lessonId, timeSpent, score } = req.body;

    let progress = await Progress.findOne({
      user: req.user.id,
      course: courseId
    });

    if (!progress) {
      return res.status(404).json({ 
        success: false,
        message: 'Progress not found. Please enroll first.' 
      });
    }

    // Mark lesson complete
    const isNew = progress.completeLesson(moduleId, lessonId, timeSpent, score);
    
    // Calculate new progress
    await progress.calculateProgress();
    
    // Save progress
    await progress.save();

    // Award points if new completion
    if (isNew) {
      const user = await User.findById(req.user.id);
      const result = user.addPoints(10);
      await user.save();

      // Update leaderboard
      await Leaderboard.findOneAndUpdate(
        { user: req.user.id },
        { $inc: { totalPoints: 10 } }
      );

      // Check for completion badge
      if (progress.overallProgress === 100) {
        const course = await Course.findById(courseId);
        const badge = {
          name: `${course.title} Master`,
          icon: '🏆',
          description: `Completed ${course.title}`
        };
        
        if (user.addBadge(badge)) {
          user.addPoints(50);
          await user.save();
          
          // Create certificate
          const certificate = await Certificate.create({
            user: req.user.id,
            course: courseId,
            score: progress.averageScore,
            completionTime: Math.ceil(
              (new Date() - progress.startedAt) / (1000 * 60 * 60 * 24)
            )
          });

          progress.certificateIssued = true;
          progress.certificateId = certificate._id;
          await progress.save();
        }
      }
    }

    res.json({ 
      success: true, 
      progress,
      message: isNew ? 'Lesson completed! +10 points 🎉' : 'Progress updated'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = exports;