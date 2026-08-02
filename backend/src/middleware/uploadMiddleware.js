const multer = require('multer');

// Keep file in memory for Cloudinary stream upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024 * 1024, // 4GB max limit for full-length movies & high-res video uploads
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
