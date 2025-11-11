// backend/routes/quiz.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

// Student routes (protected)
router.get('/:quizId', protect, quizController.getQuiz);
router.post('/:quizId/submit', protect, quizController.submitQuiz);
router.get('/attempts/:quizId', protect, quizController.getQuizAttempts);
router.get('/course/:courseId', protect, quizController.getCourseQuizzes);

// Teacher/Admin routes
router.post('/create', protect, authorize('teacher', 'admin'), quizController.createQuiz);

module.exports = router;