const multer = require('multer');

// Keep file in memory for Cloudinary stream upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max limit for Free Tier uploads
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only videos and images are allowed!'), false);
    }
  },
});

module.exports = upload;
