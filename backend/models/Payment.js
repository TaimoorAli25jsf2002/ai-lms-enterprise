// ==================================================
// backend/models/Payment.js
// ==================================================
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  
  // Amount
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'stripe'],
    default: 'stripe'
  },
  
  // Stripe Details
  stripePaymentId: String,
  stripePaymentIntentId: String,
  
  // Description
  description: String,
  invoice: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Error handling
  failureReason: String,
  failureCode: String
}, {
  timestamps: true
});

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;