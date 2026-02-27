/**
 * YOLO Cropper Service
 * Node.js bridge to the Python YOLO document cropping module.
 *
 * Spawns a Python child process that runs crop_prescription().
 * Fully fault-tolerant — returns fallback result on any failure.
 */

const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../utils/logger');

const log = createLogger('CropperService');

// Path to the Python helper script that wraps cropper.crop_prescription()
const CROPPER_DIR = path.resolve(__dirname, '..', '..', '..', 'yolo_cropper');
const BRIDGE_SCRIPT = path.resolve(CROPPER_DIR, '_node_bridge.py');
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

// Timeout for the cropper subprocess (ms)
const CROPPER_TIMEOUT = parseInt(process.env.CROPPER_TIMEOUT_MS, 10) || 30000;

/**
 * Crop a prescription image using YOLO object detection.
 *
 * @param {string} originalFileName — filename (not full path) inside uploads/
 * @returns {{ cropStatus: string, croppedFileName: string|null, durationMs: number, error?: string }}
 */
async function cropPrescription(originalFileName) {
  const start = Date.now();
  const originalPath = path.join(UPLOAD_DIR, originalFileName);

  // Basic path guard
  if (!fs.existsSync(originalPath)) {
    log.error('Original image not found for cropping', { path: originalPath });
    return {
      cropStatus: 'fallback_original',
      croppedFileName: null,
      durationMs: Date.now() - start,
      error: 'Original image not found',
    };
  }

  // Build cropped filename: original-name_cropped.ext
  const ext = path.extname(originalFileName);
  const base = path.basename(originalFileName, ext);
  const croppedFileName = `${base}_cropped${ext}`;
  const croppedPath = path.join(UPLOAD_DIR, croppedFileName);

  return new Promise((resolve) => {
    // Determine Python executable — prefer venv if present
    const pythonExe = findPython();

    log.info('Running YOLO cropper', { originalPath, croppedPath, python: pythonExe });

    // Spawn the bridge script
    const child = execFile(
      pythonExe,
      [BRIDGE_SCRIPT, originalPath, croppedPath],
      {
        timeout: CROPPER_TIMEOUT,
        cwd: CROPPER_DIR,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      },
      (err, stdout, stderr) => {
        const durationMs = Date.now() - start;

        if (err) {
          log.error('Cropper subprocess failed', {
            error: err.message,
            stderr: stderr?.slice(0, 500),
            durationMs,
          });
          return resolve({
            cropStatus: 'fallback_original',
            croppedFileName: null,
            durationMs,
            error: err.message,
          });
        }

        // Parse JSON result from stdout
        try {
          const result = JSON.parse(stdout.trim());

          if (result.success && fs.existsSync(croppedPath)) {
            log.info('Crop succeeded', { croppedPath, durationMs });
            return resolve({
              cropStatus: 'success',
              croppedFileName,
              durationMs,
            });
          }

          // Cropper ran but detection failed (no document found)
          log.warn('Cropper returned no detection', { reason: result.reason, durationMs });
          return resolve({
            cropStatus: 'fallback_original',
            croppedFileName: null,
            durationMs,
            error: result.reason || 'No document detected in image',
          });
        } catch (parseErr) {
          log.error('Failed to parse cropper output', {
            stdout: stdout?.slice(0, 300),
            error: parseErr.message,
            durationMs,
          });
          return resolve({
            cropStatus: 'fallback_original',
            croppedFileName: null,
            durationMs,
            error: 'Invalid cropper output',
          });
        }
      }
    );

    // Handle edge case where child process hangs beyond timeout
    child.on('error', (spawnErr) => {
      log.error('Cropper spawn error', { error: spawnErr.message });
      resolve({
        cropStatus: 'fallback_original',
        croppedFileName: null,
        durationMs: Date.now() - start,
        error: spawnErr.message,
      });
    });
  });
}

/**
 * Find the best Python executable available.
 * Prefers the workspace venv, then system python3, then python.
 */
function findPython() {
  // Check workspace venv
  const venvPython = path.resolve(__dirname, '..', '..', '..', '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPython)) return venvPython;

  // Unix-style venv
  const venvPythonUnix = path.resolve(__dirname, '..', '..', '..', '.venv', 'bin', 'python');
  if (fs.existsSync(venvPythonUnix)) return venvPythonUnix;

  // Fallback to system python
  return process.platform === 'win32' ? 'python' : 'python3';
}

module.exports = { cropPrescription };
