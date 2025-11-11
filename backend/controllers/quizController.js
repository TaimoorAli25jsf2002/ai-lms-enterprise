// backend/controllers/quizController.js
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');

// @route   GET /api/quiz/:quizId
// @desc    Get quiz by ID
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        message: 'Quiz not found' 
      });
    }

    // Remove correct answers from response (students shouldn't see them)
    const quizData = quiz.toObject();
    quizData.questions = quizData.questions.map(q => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points,
      difficulty: q.difficulty
    }));

    res.json({ 
      success: true, 
      quiz: quizData 
    });

  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/quiz/:quizId/submit
// @desc    Submit quiz answers
// @access  Private
exports.submitQuiz = async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    
    const quiz = await Quiz.findById(req.params.quizId);

    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        message: 'Quiz not found' 
      });
    }

    // Check attempts limit
    const previousAttempts = await QuizAttempt.countDocuments({
      user: req.user.id,
      quiz: quiz._id
    });

    if (previousAttempts >= quiz.attemptsAllowed) {
      return res.status(403).json({ 
        success: false,
        message: `Maximum attempts (${quiz.attemptsAllowed}) reached` 
      });
    }

    // Grade the quiz
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      
      if (userAnswer) {
        // Compare answers (case-insensitive and trimmed)
        const isCorrect = String(userAnswer.answer).toLowerCase().trim() === 
                         String(question.correctAnswer).toLowerCase().trim();
        
        const pointsEarned = isCorrect ? question.points : 0;
        earnedPoints += pointsEarned;

        gradedAnswers.push({
          questionId: question._id,
          userAnswer: userAnswer.answer,
          isCorrect,
          pointsEarned,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        });
      } else {
        // Question not answered
        gradedAnswers.push({
          questionId: question._id,
          userAnswer: null,
          isCorrect: false,
          pointsEarned: 0,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        });
      }
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;

    // Create quiz attempt record
    const attempt = await QuizAttempt.create({
      user: req.user.id,
      quiz: quiz._id,
      course: quiz.course,
      answers: gradedAnswers,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      timeSpent: timeSpent || 0
    });

    // Update user points and leaderboard if passed
    if (passed) {
      const user = await User.findById(req.user.id);
      const result = user.addPoints(earnedPoints);
      await user.save();

      // Update leaderboard
      await Leaderboard.findOneAndUpdate(
        { user: req.user.id },
        { 
          $inc: { 
            quizzesPassed: 1, 
            totalPoints: earnedPoints 
          }
        },
        { upsert: true, new: true }
      );

      // Check if leveled up
      if (result.leveledUp) {
        return res.json({ 
          success: true, 
          attempt: {
            ...attempt.toObject(),
            answers: gradedAnswers
          },
          leveledUp: true,
          newLevel: result.newLevel,
          message: `🎉 Congratulations! You passed with ${percentage}% and leveled up to Level ${result.newLevel}!`
        });
      }
    } else {
      // Update leaderboard for failed attempt
      await Leaderboard.findOneAndUpdate(
        { user: req.user.id },
        { $inc: { quizzesFailed: 1 } },
        { upsert: true, new: true }
      );
    }

    res.json({ 
      success: true, 
      attempt: {
        ...attempt.toObject(),
        answers: gradedAnswers
      },
      message: passed 
        ? `🎉 Congratulations! You passed with ${percentage}%! You earned ${earnedPoints} points!` 
        : `You scored ${percentage}%. Keep practicing! (Passing score: ${quiz.passingScore}%)`
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/quiz/attempts/:quizId
// @desc    Get user's quiz attempts
// @access  Private
exports.getQuizAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      user: req.user.id,
      quiz: req.params.quizId
    })
    .sort('-createdAt')
    .limit(10);

    // Calculate best score
    const bestAttempt = attempts.reduce((best, current) => {
      return (current.percentage > (best?.percentage || 0)) ? current : best;
    }, null);

    res.json({ 
      success: true, 
      attempts,
      bestScore: bestAttempt?.percentage || 0,
      totalAttempts: attempts.length
    });

  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/quiz/course/:courseId
// @desc    Get all quizzes for a course
// @access  Private
exports.getCourseQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ 
      course: req.params.courseId 
    })
    .select('title description passingScore timeLimit attemptsAllowed')
    .sort('createdAt');

    res.json({ 
      success: true, 
      count: quizzes.length,
      quizzes 
    });

  } catch (error) {
    console.error('Get course quizzes error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/quiz/create
// @desc    Create new quiz (Teacher/Admin only)
// @access  Private
exports.createQuiz = async (req, res) => {
  try {
    const {
      course,
      module,
      lesson,
      title,
      description,
      questions,
      timeLimit,
      passingScore,
      attemptsAllowed
    } = req.body;

    const quiz = await Quiz.create({
      course,
      module,
      lesson,
      title,
      description,
      questions,
      timeLimit,
      passingScore,
      attemptsAllowed
    });

    res.status(201).json({ 
      success: true, 
      quiz,
      message: 'Quiz created successfully!' 
    });

  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = exports;