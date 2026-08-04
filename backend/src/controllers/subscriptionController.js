const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const SUBSCRIPTION_PLANS = require('../config/subscriptionPlans');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { razorpayInstance, isRazorpayConfigured } = require('../config/razorpay');
const { sendSubscriptionConfirmation } = require('../services/emailService');

// @desc    Get all available subscription plans
// @route   GET /api/v1/subscriptions/plans
// @access  Public
exports.getPlans = asyncHandler(async (req, res) => {
  const plansArray = Object.values(SUBSCRIPTION_PLANS);
  return res.status(httpStatus.OK).json({
    success: true,
    plans: plansArray
  });
});

// @desc    Create Razorpay order for plan upgrade
// @route   POST /api/v1/subscriptions/create-order
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  const user = req.user;

  if (!plan || !SUBSCRIPTION_PLANS[plan]) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid subscription plan selected');
  }

  const selectedPlan = SUBSCRIPTION_PLANS[plan];
  
  if (selectedPlan.price === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Free plan does not require payment');
  }

  // Check if Razorpay keys are configured
  if (!isRazorpayConfigured()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env'
    });
  }

  // Read price directly from server configuration (Security: Never trust client amount)
  const priceInPaise = Math.round(selectedPlan.price * 100);
  const receiptId = `receipt_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // Create Razorpay Order
  const razorpayOrder = await razorpayInstance.orders.create({
    amount: priceInPaise,
    currency: 'INR',
    receipt: receiptId,
    notes: {
      userId: user._id.toString(),
      plan: plan
    }
  });

  // Save initial pending Payment document
  await Payment.create({
    user: user._id,
    plan: plan,
    amount: selectedPlan.price,
    currency: 'INR',
    receipt: receiptId,
    razorpayOrderId: razorpayOrder.id,
    status: 'pending',
    metadata: {
      previousPlan: user.subscription || 'Free',
      upgradedTo: plan
    }
  });

  return res.status(httpStatus.OK).json({
    success: true,
    orderId: razorpayOrder.id,
    amount: selectedPlan.price,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID,
    plan: plan
  });
});

// @desc    Verify Razorpay HMAC signature and complete subscription upgrade
// @route   POST /api/v1/subscriptions/verify-payment
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
  const user = req.user;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required payment verification details');
  }

  // Find existing Payment record
  const paymentRecord = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

  if (!paymentRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment record not found for this order');
  }

  // IDEMPOTENCY CHECK: If payment is already marked as success, return early
  if (paymentRecord.status === 'success') {
    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Payment already verified successfully',
      subscription: user.subscription
    });
  }

  // Verify HMAC Signature
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || keySecret.includes('your_key_secret_here')) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'RAZORPAY_KEY_SECRET is missing or invalid in backend/.env. Please add your actual Razorpay Key Secret.'
    });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  let expectedSignature = '';
  try {
    expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');
  } catch (cryptoErr) {
    console.error('[Razorpay Crypto Error]:', cryptoErr);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to compute HMAC verification signature'
    });
  }

  const isSignatureValid = expectedSignature === razorpay_signature;

  if (!isSignatureValid) {
    paymentRecord.status = 'failed';
    await paymentRecord.save();

    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid payment signature verification. Please verify that RAZORPAY_KEY_SECRET in backend/.env matches your Key ID.'
    });
  }

  // Calculate 30-day subscription tenure expiration
  const paidAtDate = new Date();
  const expiresAtDate = new Date(paidAtDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Update Payment Record
  paymentRecord.status = 'success';
  paymentRecord.razorpayPaymentId = razorpay_payment_id;
  paymentRecord.razorpaySignature = razorpay_signature;
  paymentRecord.paidAt = paidAtDate;
  paymentRecord.expiresAt = expiresAtDate;
  await paymentRecord.save();

  // Update User Subscription & Expiration Date
  const userDoc = await User.findByIdAndUpdate(
    user._id,
    { 
      subscription: plan,
      subscriptionExpiresAt: expiresAtDate
    },
    { returnDocument: 'after' }
  );

  // Send Confirmation Email with Unlocked Features (Async background call)
  const planDetails = SUBSCRIPTION_PLANS[plan] || {};
  sendSubscriptionConfirmation({
    user: userDoc,
    plan: plan,
    amount: paymentRecord.amount,
    razorpayPaymentId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
    transactionDate: paymentRecord.paidAt,
    features: planDetails.features || []
  }).catch(err => console.error('Email dispatch error:', err));

  return res.status(httpStatus.OK).json({
    success: true,
    message: `Congratulations! Your subscription has been upgraded to ${plan} Plan.`,
    subscription: plan,
    expiresAt: expiresAtDate
  });
});

// @desc    Get current user subscription status and benefits
// @route   GET /api/v1/subscriptions/current
// @access  Private
exports.getCurrentSubscription = asyncHandler(async (req, res) => {
  const userDoc = await User.findById(req.user._id);

  // Check if subscription has expired
  if (
    userDoc.subscription &&
    userDoc.subscription !== 'Free' &&
    userDoc.subscriptionExpiresAt &&
    new Date() > new Date(userDoc.subscriptionExpiresAt)
  ) {
    userDoc.subscription = 'Free';
    userDoc.subscriptionExpiresAt = null;
    await userDoc.save();
  }

  const userPlan = userDoc.subscription || 'Free';
  const planDetails = SUBSCRIPTION_PLANS[userPlan] || SUBSCRIPTION_PLANS.Free;

  return res.status(httpStatus.OK).json({
    success: true,
    plan: userPlan,
    price: planDetails.price,
    downloads: planDetails.downloadLimit,
    ads: planDetails.ads,
    quality: planDetails.quality,
    features: planDetails.features,
    expiresAt: userDoc.subscriptionExpiresAt
  });
});

// @desc    Get user's payment transaction history sorted newest first
// @route   GET /api/v1/subscriptions/history
// @access  Private
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const history = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  return res.status(httpStatus.OK).json({
    success: true,
    count: history.length,
    payments: history
  });
});
