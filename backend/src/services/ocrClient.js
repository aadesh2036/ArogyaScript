/**
 * OCR Client — sends prescription image to the external OCR service.
 * Fault-tolerant: returns empty result on failure instead of throwing.
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../utils/logger');

const log = createLogger('OCRClient');

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8001';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.75;

/**
 * Call OCR service with the uploaded image.
 * @param {string} imagePath — relative filename inside uploads/
 * @returns {{ status: string, text: string, confidence: number, engine: string, error?: string }}
 */
async function callOCR(imagePath) {
  const start = Date.now();
  try {
    const absolutePath = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads', imagePath);

    if (!fs.existsSync(absolutePath)) {
      log.error('Image file not found', { path: absolutePath });
      return { status: 'failed', text: '', confidence: 0, engine: 'none', error: 'Image file not found', durationMs: Date.now() - start };
    }

    const fetch = require('node-fetch');
    const FormData = require('form-data');

    const form = new FormData();
    form.append('image', fs.createReadStream(absolutePath));

    const response = await fetch(`${OCR_SERVICE_URL}/ocr`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 30000,
    });

    if (!response.ok) {
      const errBody = await response.text();
      log.warn('OCR service returned non-OK', { status: response.status, body: errBody });
      return { status: 'failed', text: '', confidence: 0, engine: 'none', error: `OCR service error: ${response.status}`, durationMs: Date.now() - start };
    }

    const data = await response.json();
    const text = data.text || data.extracted_text || '';
    const confidence = data.confidence || data.ocr_confidence || 0;
    const engine = data.engine || data.ocr_engine || 'external';

    log.info('OCR completed', { textLength: text.length, confidence, engine });

    return {
      status: 'success',
      text,
      confidence,
      engine,
      qualityWarning: confidence < CONFIDENCE_THRESHOLD ? 'Low OCR confidence — results may be inaccurate' : null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    log.error('OCR service call failed', { error: err.message });
    return {
      status: 'failed',
      text: '',
      confidence: 0,
      engine: 'none',
      error: err.message,
      durationMs: Date.now() - start,
    };
  }
}

module.exports = { callOCR };
