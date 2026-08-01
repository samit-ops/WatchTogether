const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPlans,
  createOrder,
  verifyPayment,
  getCurrentSubscription,
  getPaymentHistory
} = require('../controllers/subscriptionController');

router.get('/plans', getPlans);
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/current', protect, getCurrentSubscription);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
