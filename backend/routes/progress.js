// ==================================================
// FILE 24: backend/routes/progress.js
// ==================================================
const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.get('/:courseId', protect, progressController.getCourseProgress);
router.post('/complete-lesson', protect, progressController.completeLesson);

module.exports = router;
