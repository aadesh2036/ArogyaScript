/**
 * Pipeline Orchestrator
 * Runs the full prescription intelligence pipeline in sequence.
 * Each module is fault-tolerant — failure in one module does NOT block the rest.
 *
 * Steps:
 *   0. Preprocessing → YOLO crop to isolate prescription document
 *   1. OCR → extract text from image
 *   2. Entity extraction → rule regex + Groq LLM fallback
 *   3. Anomaly detection → ML pipeline (preferred) or rule-based fallback
 *   4. Intervention engine → generate clinical suggestions
 *   5. AI Reasoning → Groq (Llama3) explainability with rule-based fallback (non-critical)
 *   6. Persist → save all results to MongoDB
 */

const Prescription = require('../models/Prescription.model');
const { cropPrescription } = require('./cropperService');
const { callOCR } = require('./ocrClient');
const { callMLPipeline } = require('./mlClient');
const { structureText } = require('./structuringService');
const { detectAnomalies } = require('./anomalyDetector');
const { generateInterventions } = require('./interventionEngine');
const { runReasoning } = require('./reasoning/reasoningService');
const { uploadToCloudinary, cleanupTempFiles } = require('./cloudinaryService');
const { createLogger } = require('../utils/logger');

const log = createLogger('Pipeline');

/**
 * Run the full pipeline for a prescription.
 * Updates the DB record in-place as each module completes.
 *
 * @param {string} prescriptionId
 * @param {string} imagePath — filename inside uploads/
 * @returns {object} final prescription document
 */
async function runPipeline(prescriptionId, imagePath) {
  const pipelineStart = Date.now();
  log.info('Pipeline started', { prescriptionId, imagePath });

  const pipelineStatus = {
    preprocessing: { status: 'skipped', durationMs: 0 },
    ocr: { status: 'skipped', durationMs: 0 },
    structuring: { status: 'skipped', durationMs: 0 },
    anomaly: { status: 'skipped', durationMs: 0 },
    intervention: { status: 'skipped', durationMs: 0 },
    gemini: { status: 'skipped', durationMs: 0 },
    overall: 'processing',
  };

  let ocrText = '';
  let ocrConfidence = 0;
  let ocrEngine = '';
  let entities = [];
  let anomalyFlags = [];
  let interactions = [];
  let riskScore = { overall: 0, level: 'safe', signals: [] };
  let interventions = [];

  // The image file that OCR will actually process (may be cropped)
  let ocrInputPath = imagePath;

  // ── Update status to processing ──
  await safeUpdate(prescriptionId, {
    status: 'processing',
    'pipelineStatus.overall': 'processing',
    originalImagePath: imagePath,
  });

  // ═══════════════════════════════════════════════
  // STEP 0: YOLO Preprocessing (crop prescription document)
  // Non-critical — pipeline ALWAYS continues even if this fails
  // ═══════════════════════════════════════════════
  try {
    const cropResult = await cropPrescription(imagePath);
    pipelineStatus.preprocessing = {
      status: cropResult.cropStatus === 'success' ? 'success' : 'failed',
      error: cropResult.error,
      durationMs: cropResult.durationMs,
    };

    const updatePayload = {
      cropStatus: cropResult.cropStatus,
      preprocessingTimestamp: new Date(),
      'pipelineStatus.preprocessing': pipelineStatus.preprocessing,
    };

    if (cropResult.cropStatus === 'success' && cropResult.croppedFileName) {
      ocrInputPath = cropResult.croppedFileName;
      updatePayload.croppedImagePath = cropResult.croppedFileName;
      log.info('Preprocessing: crop succeeded, using cropped image for OCR', {
        prescriptionId,
        croppedFile: cropResult.croppedFileName,
        durationMs: cropResult.durationMs,
      });

      // Upload cropped image to Cloudinary (non-blocking)
      try {
        const croppedCloud = await uploadToCloudinary(cropResult.croppedFileName, {
          folder: 'arogyascript/cropped',
          publicId: `${prescriptionId}_cropped`,
        });
        if (croppedCloud.success) {
          updatePayload.croppedImageUrl = croppedCloud.url;
          updatePayload.croppedPublicId = croppedCloud.publicId;
          updatePayload['cloudUploadStatus.cropped'] = true;
          log.info('Cropped image uploaded to Cloudinary', { prescriptionId, url: croppedCloud.url });
        }
      } catch (cloudErr) {
        log.error('Cloudinary cropped upload failed', { prescriptionId, error: cloudErr.message });
      }
    } else {
      log.warn('Preprocessing: crop failed, using original image for OCR', {
        prescriptionId,
        reason: cropResult.error,
        durationMs: cropResult.durationMs,
      });
    }

    await safeUpdate(prescriptionId, updatePayload);
  } catch (err) {
    log.error('Preprocessing step crashed', { error: err.message });
    pipelineStatus.preprocessing = { status: 'failed', error: err.message, durationMs: 0 };
    await safeUpdate(prescriptionId, {
      cropStatus: 'fallback_original',
      preprocessingTimestamp: new Date(),
      'pipelineStatus.preprocessing': pipelineStatus.preprocessing,
    });
  }

  // ═══════════════════════════════════════════════
  // STEP 1: OCR (dual-path: run on BOTH original + cropped, merge results)
  // This prevents text loss from aggressive cropping.
  // ═══════════════════════════════════════════════
  try {
    const hasCrop = ocrInputPath !== imagePath;

    // Always OCR the original image
    const originalOcr = await callOCR(imagePath);
    const originalText = originalOcr.text || '';
    const originalConf = originalOcr.confidence || 0;
    ocrEngine = originalOcr.engine || 'none';

    log.info('OCR on original done', { textLen: originalText.length, confidence: originalConf });

    let croppedText = '';
    let croppedConf = 0;

    // If we have a cropped image, OCR it too
    if (hasCrop) {
      try {
        const croppedOcr = await callOCR(ocrInputPath);
        croppedText = croppedOcr.text || '';
        croppedConf = croppedOcr.confidence || 0;
        log.info('OCR on cropped done', { textLen: croppedText.length, confidence: croppedConf });
      } catch (cropOcrErr) {
        log.warn('OCR on cropped image failed, using original only', { error: cropOcrErr.message });
      }
    }

    // Merge: pick the longer/better text, or combine unique lines
    if (hasCrop && croppedText && originalText) {
      ocrText = mergeOcrTexts(originalText, croppedText);
      ocrConfidence = Math.max(originalConf, croppedConf);
      log.info('OCR merged', { originalLen: originalText.length, croppedLen: croppedText.length, mergedLen: ocrText.length });
    } else if (croppedText && croppedConf > originalConf) {
      ocrText = croppedText;
      ocrConfidence = croppedConf;
    } else {
      ocrText = originalText;
      ocrConfidence = originalConf;
    }

    pipelineStatus.ocr = {
      status: (originalOcr.status === 'success' || croppedText) ? 'success' : 'failed',
      error: originalOcr.error,
      durationMs: originalOcr.durationMs,
      mode: hasCrop ? 'dual' : 'single',
    };

    await safeUpdate(prescriptionId, {
      ocrText,
      ocrConfidence,
      'metadata.ocrEngine': ocrEngine,
      'metadata.ocrMode': hasCrop ? 'dual' : 'single',
      'pipelineStatus.ocr': pipelineStatus.ocr,
      ...(originalOcr.processedImagePath ? { processedImagePath: originalOcr.processedImagePath } : {}),
    });

    log.info('OCR step done', { status: pipelineStatus.ocr.status, textLen: ocrText.length, mode: hasCrop ? 'dual' : 'single' });
  } catch (err) {
    log.error('OCR step crashed', { error: err.message });
    pipelineStatus.ocr = { status: 'failed', error: err.message, durationMs: 0 };
    await safeUpdate(prescriptionId, { 'pipelineStatus.ocr': pipelineStatus.ocr });
  }

  // ═══════════════════════════════════════════════
  // STEP 2: Entity extraction (rule-based + LLM fallback)
  // ═══════════════════════════════════════════════
  try {
    const structResult = await structureText(ocrText);
    entities = structResult.entities || [];
    pipelineStatus.structuring = {
      status: structResult.status === 'success' ? 'success' : 'failed',
      error: structResult.error,
      durationMs: structResult.durationMs,
    };

    await safeUpdate(prescriptionId, {
      extractedEntities: entities,
      'pipelineStatus.structuring': pipelineStatus.structuring,
    });

    log.info('Structuring step done', { status: structResult.status, entityCount: entities.length });
  } catch (err) {
    log.error('Structuring step crashed', { error: err.message });
    pipelineStatus.structuring = { status: 'failed', error: err.message, durationMs: 0 };
    await safeUpdate(prescriptionId, { 'pipelineStatus.structuring': pipelineStatus.structuring });
  }

  // ═══════════════════════════════════════════════
  // STEP 3: Anomaly detection (ML preferred, rule fallback)
  // ═══════════════════════════════════════════════
  try {
    let mlSucceeded = false;

    // Try ML pipeline first
    if (process.env.ML_PIPELINE_URL) {
      const mlResult = await callMLPipeline({ entities, ocrText, prescriptionId });
      if (mlResult.status === 'success') {
        mlSucceeded = true;
        anomalyFlags = mlResult.flags || [];
        interactions = mlResult.interactions || [];
        if (mlResult.riskScore) riskScore = mlResult.riskScore;
        log.info('ML pipeline succeeded', { flagCount: anomalyFlags.length });
      } else {
        log.warn('ML pipeline failed, falling back to rules', { error: mlResult.error });
      }
    }

    // Fallback to rule-based detection
    if (!mlSucceeded) {
      const ruleResult = detectAnomalies({ entities, ocrText });
      anomalyFlags = ruleResult.flags || [];
      interactions = ruleResult.interactions || [];
      riskScore = ruleResult.riskScore || riskScore;
      log.info('Rule-based anomaly detection used', { flagCount: anomalyFlags.length });
    }

    pipelineStatus.anomaly = {
      status: 'success',
      durationMs: Date.now() - pipelineStart,
    };

    await safeUpdate(prescriptionId, {
      anomalyFlags,
      interactions,
      riskScore,
      'pipelineStatus.anomaly': pipelineStatus.anomaly,
    });
  } catch (err) {
    log.error('Anomaly step crashed', { error: err.message });
    // Even if anomaly detection crashes fully, try rule-based as last resort
    try {
      const ruleResult = detectAnomalies({ entities, ocrText });
      anomalyFlags = ruleResult.flags || [];
      interactions = ruleResult.interactions || [];
      riskScore = ruleResult.riskScore || riskScore;
      pipelineStatus.anomaly = { status: 'success', error: 'ML failed, used rules', durationMs: 0 };
    } catch {
      pipelineStatus.anomaly = { status: 'failed', error: err.message, durationMs: 0 };
    }
    await safeUpdate(prescriptionId, {
      anomalyFlags,
      interactions,
      riskScore,
      'pipelineStatus.anomaly': pipelineStatus.anomaly,
    });
  }

  // ═══════════════════════════════════════════════
  // STEP 4: Intervention engine
  // ═══════════════════════════════════════════════
  try {
    const ivResult = generateInterventions({ flags: anomalyFlags, interactions, entities });
    interventions = ivResult.interventions || [];
    pipelineStatus.intervention = {
      status: ivResult.status === 'success' ? 'success' : 'failed',
      error: ivResult.error,
      durationMs: ivResult.durationMs,
    };

    await safeUpdate(prescriptionId, {
      interventions,
      'pipelineStatus.intervention': pipelineStatus.intervention,
    });

    log.info('Intervention step done', { count: interventions.length });
  } catch (err) {
    log.error('Intervention step crashed', { error: err.message });
    pipelineStatus.intervention = { status: 'failed', error: err.message, durationMs: 0 };
    await safeUpdate(prescriptionId, { 'pipelineStatus.intervention': pipelineStatus.intervention });
  }

  // ═══════════════════════════════════════════════
  // STEP 5: Explainable AI Reasoning (non-critical)
  // Uses Groq (Llama3) with rule-based fallback.
  // Pipeline will ALWAYS continue even if this step fails.
  // ═══════════════════════════════════════════════
  try {
    const reasoningStart = Date.now();
    const reasoningResult = await runReasoning({
      prescriptionId,
      ocrText,
      entities,
      interactions,
      anomalyFlags,
      interventions,
    });

    pipelineStatus.gemini = {
      status: reasoningResult.gemini_status === 'success' ? 'success' : 'failed',
      error: reasoningResult.gemini_status !== 'success' ? (reasoningResult.error || 'Reasoning unavailable') : null,
      durationMs: Date.now() - reasoningStart,
    };

    // reasoningService handles its own DB persistence — we only update the pipelineStatus here
    await safeUpdate(prescriptionId, {
      'pipelineStatus.gemini': pipelineStatus.gemini,
    });

    log.info('Reasoning step done', {
      status: reasoningResult.gemini_status,
      interventionCount: reasoningResult.interventions?.length,
      durationMs: pipelineStatus.gemini.durationMs,
    });
  } catch (err) {
    // This branch should never fire — runReasoning never throws
    log.error('Reasoning step unexpectedly crashed', { error: err.message });
    pipelineStatus.gemini = { status: 'failed', error: err.message, durationMs: 0 };
    await safeUpdate(prescriptionId, { 'pipelineStatus.gemini': pipelineStatus.gemini });
  }

  // ═══════════════════════════════════════════════
  // STEP 6: Finalize
  // ═══════════════════════════════════════════════
  // Gemini + preprocessing failures do NOT count against overall pipeline status
  const nonCriticalSteps = new Set(['gemini', 'overall', 'preprocessing']);
  const nonGeminiStatuses = Object.entries(pipelineStatus)
    .filter(([k, v]) => !nonCriticalSteps.has(k) && typeof v === 'object');

  const anyFailed = nonGeminiStatuses.some(([, m]) => m.status === 'failed');
  const allFailed = nonGeminiStatuses.every(([, m]) => m.status === 'failed');

  pipelineStatus.overall = allFailed ? 'failed' : anyFailed ? 'partial' : 'completed';
  const finalStatus = allFailed ? 'failed' : 'completed';
  const totalMs = Date.now() - pipelineStart;

  const finalDoc = await safeUpdate(prescriptionId, {
    status: finalStatus,
    pipelineStatus,
    'metadata.processingTimeMs': totalMs,
  });

  log.info('Pipeline finished', {
    prescriptionId,
    overall: pipelineStatus.overall,
    durationMs: totalMs,
    entityCount: entities.length,
    flagCount: anomalyFlags.length,
    interventionCount: interventions.length,
  });

  // ═══════════════════════════════════════════════
  // STEP 7: Cleanup temp files (non-blocking)
  // Only remove local files if Cloudinary uploads succeeded
  // ═══════════════════════════════════════════════
  try {
    const doc = await Prescription.findOne({ prescriptionId }).select('cloudUploadStatus originalImagePath croppedImagePath').lean();
    if (doc?.cloudUploadStatus?.original && doc?.cloudUploadStatus?.cropped) {
      cleanupTempFiles(doc.originalImagePath, doc.croppedImagePath);
      log.info('Temp files cleaned up (both cloud uploads succeeded)', { prescriptionId });
    } else if (doc?.cloudUploadStatus?.original) {
      // Only original was uploaded — keep cropped locally as fallback
      log.info('Keeping local files (only original uploaded to cloud)', { prescriptionId });
    } else {
      log.info('Keeping local files (cloud uploads incomplete)', { prescriptionId });
    }
  } catch (cleanupErr) {
    log.warn('Temp file cleanup failed', { prescriptionId, error: cleanupErr.message });
  }

  return finalDoc;
}

/**
 * Safe DB update — logs errors but never throws.
 */
async function safeUpdate(prescriptionId, update) {
  try {
    return await Prescription.findOneAndUpdate(
      { prescriptionId },
      { $set: update },
      { new: true }
    );
  } catch (err) {
    log.error('DB update failed', { prescriptionId, error: err.message });
    return null;
  }
}

/**
 * Merge OCR texts from original and cropped images.
 * Combines unique lines (normalized) so no text is lost due to aggressive cropping.
 * The cropped text usually has less noise, while the original has full coverage.
 *
 * Strategy: use original as base, then append any unique lines from cropped.
 */
function mergeOcrTexts(originalText, croppedText) {
  const normalize = (line) => line.trim().toLowerCase().replace(/\s+/g, ' ');

  const originalLines = originalText.split('\n').map((l) => l.trim()).filter(Boolean);
  const croppedLines = croppedText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Build a set of normalized lines from the original
  const seenNormalized = new Set(originalLines.map(normalize));

  // Start with all original lines
  const merged = [...originalLines];

  // Append unique lines from cropped that aren't already in original
  for (const line of croppedLines) {
    const norm = normalize(line);
    if (norm && !seenNormalized.has(norm)) {
      // Check for partial substring matches (fuzzy dedup)
      const isSubstring = [...seenNormalized].some(
        (existing) => existing.includes(norm) || norm.includes(existing)
      );
      if (!isSubstring) {
        merged.push(line);
        seenNormalized.add(norm);
      }
    }
  }

  return merged.join('\n');
}

module.exports = { runPipeline };
