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
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-with-otp', resetPasswordWithOtp);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/theme', protect, updateThemePreference);

module.exports = router;
