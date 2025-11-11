// ==================================================
// FILE 26: backend/routes/ai.js
// ==================================================
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, aiController.aiChat);
router.post('/explain-code', protect, aiController.explainCode);
router.post('/generate-quiz', protect, aiController.generateQuiz);
router.post('/recommend', protect, aiController.getRecommendations);

module.exports = router;