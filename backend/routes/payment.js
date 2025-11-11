// backend/routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', paymentController.getPlans);

// Protected routes (require authentication)
router.post('/create-checkout-session', protect, paymentController.createCheckoutSession);
router.get('/verify-session/:sessionId', protect, paymentController.verifySession);
router.post('/cancel-subscription', protect, paymentController.cancelSubscription);
router.get('/subscription', protect, paymentController.getSubscription);
router.get('/history', protect, paymentController.getPaymentHistory);

// Stripe webhook (no auth - Stripe handles verification)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;