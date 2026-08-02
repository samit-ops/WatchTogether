const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const {
  getCommentsByVideo,
  createComment,
  editComment,
  deleteComment,
  toggleLikeComment,
  toggleDislikeComment,
  reportComment
} = require('../controllers/commentController');

// Optional auth middleware for GET routes to identify if current user liked/disliked comments
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_dev');
      req.user = await User.findById(decoded.id);
    }
  } catch (err) {
    // Ignore invalid token for optional auth
  }
  next();
};

router.get('/video/:videoId', optionalAuth, getCommentsByVideo);
router.post('/video/:videoId', protect, createComment);
router.put('/:commentId', protect, editComment);
router.delete('/:commentId', protect, deleteComment);
router.post('/:commentId/like', protect, toggleLikeComment);
router.post('/:commentId/dislike', protect, toggleDislikeComment);
router.post('/:commentId/report', protect, reportComment);

module.exports = router;
