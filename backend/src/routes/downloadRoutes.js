const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  processDownload,
  getUserDownloads,
  getDownloadStatus,
} = require('../controllers/downloadController');

// All download routes require authentication
router.use(protect);

router.get('/my', getUserDownloads);
router.get('/status', getDownloadStatus);
router.post('/:videoId', processDownload);

module.exports = router;
