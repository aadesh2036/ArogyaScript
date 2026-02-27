/**
 * Cloudinary Upload Service
 * Handles uploading prescription images to Cloudinary and cleaning up temp files.
 * Fully fault-tolerant — failures are logged but never block the pipeline.
 */

const fs = require('fs');
const path = require('path');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const { createLogger } = require('../utils/logger');

const log = createLogger('CloudinaryService');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

/**
 * Upload a local file to Cloudinary.
 *
 * @param {string} fileName — filename (not full path) inside uploads/
 * @param {object} options
 * @param {string} options.folder — Cloudinary folder (default: 'arogyascript/prescriptions')
 * @param {string} options.publicId — custom public_id (optional)
 * @param {string} options.resourceType — 'image' | 'raw' (default: 'image')
 * @returns {{ success: boolean, url?: string, publicId?: string, error?: string }}
 */
async function uploadToCloudinary(fileName, options = {}) {
  if (!isConfigured) {
    log.warn('Cloudinary not configured — skipping upload', { fileName });
    return { success: false, error: 'Cloudinary not configured' };
  }

  const filePath = path.join(UPLOAD_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    log.error('File not found for Cloudinary upload', { filePath });
    return { success: false, error: 'File not found' };
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'arogyascript/prescriptions',
      public_id: options.publicId || path.basename(fileName, path.extname(fileName)),
      resource_type: options.resourceType || 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    log.info('Cloudinary upload succeeded', {
      fileName,
      publicId: result.public_id,
      url: result.secure_url,
      bytes: result.bytes,
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    log.error('Cloudinary upload failed', { fileName, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Delete an asset from Cloudinary by public_id.
 *
 * @param {string} publicId
 * @returns {{ success: boolean, error?: string }}
 */
async function deleteFromCloudinary(publicId) {
  if (!isConfigured || !publicId) return { success: false, error: 'Not configured or no publicId' };

  try {
    await cloudinary.uploader.destroy(publicId);
    log.info('Cloudinary asset deleted', { publicId });
    return { success: true };
  } catch (err) {
    log.error('Cloudinary delete failed', { publicId, error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Remove temporary local files after they have been uploaded to Cloudinary.
 * Silently ignores missing files.
 *
 * @param {...string} fileNames — one or more filenames inside uploads/
 */
function cleanupTempFiles(...fileNames) {
  for (const fileName of fileNames) {
    if (!fileName) continue;
    const filePath = path.join(UPLOAD_DIR, fileName);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log.info('Temp file deleted', { filePath });
      }
    } catch (err) {
      log.warn('Failed to delete temp file', { filePath, error: err.message });
    }
  }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary, cleanupTempFiles };
