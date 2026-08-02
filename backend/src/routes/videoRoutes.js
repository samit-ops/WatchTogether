const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { 
  getVideos, 
  getVideo, 
  uploadVideo, 
  updateVideo, 
  deleteVideo, 
  incrementViews,
  getPlatformVideos,
  likeVideo,
  dislikeVideo,
  getMyVideos
} = require('../controllers/videoController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

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
  } catch (err) {}
  next();
};

router.get('/', getVideos);
router.get('/platform', getPlatformVideos);
router.get('/me', protect, getMyVideos);
router.get('/:id', optionalAuth, getVideo);
router.put('/:id/view', incrementViews);

router.post('/:id/like', protect, likeVideo);
router.post('/:id/dislike', protect, dislikeVideo);

router.post(
  '/upload', 
  protect, 
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), 
  uploadVideo
);
router.put(
  '/:id', 
  protect, 
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), 
  updateVideo
);
router.delete('/:id', protect, deleteVideo);

module.exports = router;
