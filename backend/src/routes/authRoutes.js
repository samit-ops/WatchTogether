const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updateThemePreference,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPasswordWithOtp
} = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { status: 429, message: 'Too many authentication attempts. Please try again later.' }
});

const router = express.Router();

router.post('/register', register);
router.post('/login', authLimiter, login);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/resend-otp', authLimiter, resendOtp);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password-with-otp', authLimiter, resetPasswordWithOtp);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/theme', protect, updateThemePreference);

module.exports = router;
