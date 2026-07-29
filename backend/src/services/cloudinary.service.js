const cloudinary = require('cloudinary').v2;
const logger = require('../config/logger');

console.log("--- Cloudinary Init Debug ---");
console.log("Cloud Name:", !!process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", !!process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", !!process.env.CLOUDINARY_API_SECRET);
console.log("-----------------------------");

// Configure Cloudinary only if variables exist
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary configured successfully.');
} else {
  logger.warn('Cloudinary credentials missing. Video uploads will be disabled.');
}

const isConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const uploadToCloudinary = (fileBuffer, resourceType = 'auto', folder = 'watch-together') => {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(new Error('Cloudinary is not configured.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary Upload Error: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      }
    );

    // End stream with buffer
    uploadStream.end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = 'video') => {
  if (!isConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    logger.error(`Cloudinary Deletion Error: ${error.message}`);
  }
};

module.exports = {
  isConfigured,
  uploadToCloudinary,
  deleteFromCloudinary,
};
