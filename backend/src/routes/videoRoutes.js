const express = require('express');
const { 
  getVideos, 
  getVideo, 
  uploadVideo, 
  updateVideo, 
  deleteVideo, 
  incrementViews 
} = require('../controllers/videoController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', getVideos);
router.get('/:id', getVideo);
router.put('/:id/view', incrementViews);

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
