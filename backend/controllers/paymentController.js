// backend/controllers/paymentController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Subscription Plans Configuration
const PLANS = {
  basic: {
    name: 'Basic',
    price: 999, // $9.99 in cents
    features: ['Access to 10 courses', 'Basic AI tutor', 'Progress tracking', 'Certificates'],
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic'
  },
  premium: {
    name: 'Premium',
    price: 1999, // $19.99
    features: ['Access to ALL courses', 'Advanced AI tutor', 'Priority support', 'Exclusive content'],
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium'
  },
  enterprise: {
    name: 'Enterprise',
    price: 4999, // $49.99
    features: ['Everything in Premium', 'Custom courses', 'API access', 'Dedicated support'],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise'
  }
};

// @route   POST /api/payment/create-checkout-session
// @desc    Create Stripe checkout session
// @access  Private
exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;

    // Validate plan
    if (!PLANS[plan]) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid plan selected',
        availablePlans: Object.keys(PLANS)
      });
    }

    const user = await User.findById(req.user.id);

    // Create or retrieve Stripe customer
    let customer;
    if (user.stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } catch (error) {
        // Customer doesn't exist, create new one
        customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user._id.toString()
          }
        });
        user.stripeCustomerId = customer.id;
        await user.save();
      }
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${PLANS[plan].name} Plan - Monthly`,
              description: PLANS[plan].features.join(', '),
            },
            unit_amount: PLANS[plan].price,
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId: user._id.toString(),
        plan: plan
      }
    });

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment processing error',
      error: error.message 
    });
  }
};

// @route   GET /api/payment/verify-session/:sessionId
// @desc    Verify payment and activate subscription
// @access  Private
exports.verifySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const userId = session.metadata.userId;
      const plan = session.metadata.plan;

      // Create or update subscription record
      let subscription = await Subscription.findOne({ user: userId });

      if (subscription) {
        // Update existing subscription
        subscription.plan = plan;
        subscription.status = 'active';
        subscription.stripeSubscriptionId = session.subscription;
        subscription.startDate = new Date();
        subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        subscription.amount = PLANS[plan].price / 100;
        subscription.autoRenew = true;
      } else {
        // Create new subscription
        subscription = await Subscription.create({
          user: userId,
          plan: plan,
          status: 'active',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          amount: PLANS[plan].price / 100,
          currency: 'USD',
          features: PLANS[plan].features.map(f => ({ name: f, enabled: true })),
          autoRenew: true
        });
      }

      await subscription.save();

      // Create payment record
      await Payment.create({
        user: userId,
        subscription: subscription._id,
        amount: PLANS[plan].price / 100,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'stripe',
        stripePaymentId: session.payment_intent,
        stripePaymentIntentId: session.payment_intent,
        description: `${PLANS[plan].name} Plan - Monthly Subscription`
      });

      // Update user subscription status
      await User.findByIdAndUpdate(userId, {
        subscription: plan,
        subscriptionStatus: 'active'
      });

      res.json({ 
        success: true, 
        subscription,
        message: 'Payment successful! Your subscription is now active.' 
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: 'Payment not completed' 
      });
    }

  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Verification error',
      error: error.message 
    });
  }
};

// @route   POST /api/payment/cancel-subscription
// @desc    Cancel user subscription
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ 
      user: userId, 
      status: 'active' 
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false,
        message: 'No active subscription found' 
      });
    }

    // Cancel in Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.cancelAtPeriodEnd = true;
    subscription.autoRenew = false;
    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: 'cancelled'
    });

    res.json({ 
      success: true, 
      message: 'Subscription will be cancelled at the end of billing period',
      subscription
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Cancellation error',
      error: error.message 
    });
  }
};

// @route   GET /api/payment/subscription
// @desc    Get user's current subscription
// @access  Private
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ 
      user: req.user.id 
    }).sort('-createdAt');

    if (!subscription) {
      return res.json({ 
        success: true, 
        subscription: { 
          plan: 'free', 
          status: 'active',
          features: ['Access to free courses', 'Basic progress tracking']
        } 
      });
    }

    res.json({ 
      success: true, 
      subscription 
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching subscription',
      error: error.message 
    });
  }
};

// @route   GET /api/payment/history
// @desc    Get payment history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ user: req.user.id })
      .populate('subscription', 'plan')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Payment.countDocuments({ user: req.user.id });

    res.json({ 
      success: true, 
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching payment history',
      error: error.message 
    });
  }
};

// @route   POST /api/payment/webhook
// @desc    Stripe webhook handler
// @access  Public (Stripe calls this)
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      // Payment is successful and subscription is created
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Handle subscription cancellation
      await Subscription.updateOne(
        { stripeSubscriptionId: subscription.id },
        { status: 'cancelled' }
      );
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Payment succeeded:', invoice.id);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      // Handle failed payment
      await Payment.updateOne(
        { stripePaymentIntentId: failedInvoice.payment_intent },
        { 
          status: 'failed',
          failureReason: failedInvoice.last_payment_error?.message 
        }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// @route   GET /api/payment/plans
// @desc    Get available subscription plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    const plans = Object.entries(PLANS).map(([key, value]) => ({
      id: key,
      ...value,
      priceFormatted: `$${(value.price / 100).toFixed(2)}`
    }));

    res.json({ 
      success: true, 
      plans 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching plans',
      error: error.message 
    });
  }
};

module.exports = exports;