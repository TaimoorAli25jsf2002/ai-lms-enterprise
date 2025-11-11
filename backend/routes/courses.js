// ==================================================
// FILE 23: backend/routes/courses.js
// ==================================================
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);

// Student routes (protected)
router.post('/enroll/:id', protect, courseController.enrollInCourse);
router.get('/my/enrolled', protect, courseController.getEnrolledCourses);
router.post('/:id/review', protect, courseController.addReview);

// Teacher/Admin routes
router.post('/', protect, authorize('teacher', 'admin'), courseController.createCourse);
router.put('/:id', protect, authorize('teacher', 'admin'), courseController.updateCourse);
router.delete('/:id', protect, authorize('admin'), courseController.deleteCourse);

// Module and Lesson management
router.post('/:courseId/modules', protect, authorize('teacher', 'admin'), courseController.addModule);
router.post('/:courseId/modules/:moduleId/lessons', protect, authorize('teacher', 'admin'), courseController.addLesson);

module.exports = router;
