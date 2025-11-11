// backend/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'trial', 'past_due'],
    default: 'trial'
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  
  // Billing
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  trialEndDate: Date,
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Features
  features: [{
    name: String,
    enabled: Boolean
  }],
  
  // Settings
  autoRenew: {
    type: Boolean,
    default: false
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;





