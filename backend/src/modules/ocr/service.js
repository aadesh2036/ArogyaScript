const axios = require('axios');
const OcrOutput = require('./model');
const imageQualityService = require('../imageQuality/service');
const prescriptionService = require('../prescriptions/service');
const analyticsService = require('../analytics/service');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

/**
 * Full OCR Orchestration:
 * 1. Call Python ML microservice /process
 * 2. Store image quality data
 * 3. Store OCR output (raw text + tokens)
 * 4. Emit OCR_COMPLETED event
 */
const runOCRPipeline = async (prescription) => {
  try {
    await prescriptionService.updateStatus(prescription._id, 'processing');
    logger.info(`[OCR] Starting pipeline for prescription: ${prescription._id}`);

    const ML_URL = process.env.ML_PIPELINE_URL || 'http://localhost:8000';

    const response = await axios.post(`${ML_URL}/process`, {
      prescriptionId: prescription._id.toString(),
      imagePath: prescription.imagePath,
    });

    const { imageQuality, ocr } = response.data;

    // Store image quality
    if (imageQuality) {
      await imageQualityService.saveQualityData(prescription._id, {
        blurScore: imageQuality.blurScore,
        brightnessScore: imageQuality.brightnessScore,
        skewAngle: imageQuality.skewAngle,
        cropCoordinates: imageQuality.cropCoordinates,
        isReadable: imageQuality.isReadable ?? true,
      });
    }

    // Store OCR output
    const avgConfidence =
      ocr.tokens && ocr.tokens.length > 0
        ? ocr.tokens.reduce((sum, t) => sum + (t.confidence || 0), 0) / ocr.tokens.length
        : 0;

    const ocrDoc = await OcrOutput.findOneAndUpdate(
      { prescriptionId: prescription._id },
      {
        prescriptionId: prescription._id,
        rawText: ocr.rawText || '',
        averageConfidence: avgConfidence,
        tokens: ocr.tokens || [],
      },
      { upsert: true, new: true }
    );

    await analyticsService.logEvent('OCR_COMPLETED', prescription._id, {
      averageConfidence: avgConfidence,
      tokenCount: ocrDoc.tokens.length,
    });

    // Emit to pipeline event bus
    eventBus.emit(EVENTS.OCR_COMPLETED, { prescription, ocrOutput: ocrDoc });
    logger.info(`[OCR] Completed for prescription: ${prescription._id}`);
  } catch (err) {
    logger.error(`[OCR] Pipeline failed for ${prescription._id}: ${err.message}`);
    await prescriptionService.updateStatus(prescription._id, 'failed', err.message);
    eventBus.emit(EVENTS.PIPELINE_FAILED, { prescription, error: err.message });
  }
};

const getByPrescription = async (prescriptionId) => OcrOutput.findOne({ prescriptionId });

module.exports = { runOCRPipeline, getByPrescription };
