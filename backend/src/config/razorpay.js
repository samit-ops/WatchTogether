const Razorpay = require('razorpay');
const logger = require('./logger');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;

if (!keyId || !keySecret) {
  logger.warn('[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in environment variables. Razorpay endpoints will require valid credentials.');
  // Instantiate with placeholder to avoid module load crash
  razorpayInstance = new Razorpay({
    key_id: keyId || 'rzp_test_placeholder',
    key_secret: keySecret || 'placeholder_secret'
  });
} else {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
  logger.info('[Razorpay] Razorpay SDK initialized successfully in Test Mode.');
}

const isRazorpayConfigured = () => {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};

module.exports = {
  razorpayInstance,
  isRazorpayConfigured
};
