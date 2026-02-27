/**
 * Cloudinary Configuration
 * Initializes and exports the Cloudinary SDK instance.
 * Gracefully degrades if credentials are missing.
 */

const cloudinary = require('cloudinary').v2;
const { createLogger } = require('../utils/logger');

const log = createLogger('Cloudinary');

const isConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  log.info('Cloudinary configured', { cloud: process.env.CLOUDINARY_CLOUD_NAME });
} else {
  log.warn('Cloudinary credentials missing — cloud uploads disabled');
}

module.exports = { cloudinary, isConfigured };
