/**
 * Pipeline Orchestrator
 * Runs the full prescription intelligence pipeline in sequence.
 * Each module is fault-tolerant — failure in one module does NOT block the rest.
 *
 * Steps:
 *   1. OCR → extract text from image
 *   2. Structuring → extract entities from text
 *   3. Anomaly detection → ML pipeline (preferred) or rule-based fallback
 *   4. Intervention engine → generate clinical suggestions
 *   5. Persist → save all results to MongoDB
 */

const Prescription = require('../models/Prescription.model');
const { callOCR } = require('./ocrClient');
const { callMLPipeline } = require('./mlClient');
const { structureText } = require('./structuringService');
const { detectAnomalies } = require('./anomalyDetector');
const { generateInterventions } = require('./interventionEngine');
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
    ocr: { status: 'skipped', durationMs: 0 },
    structuring: { status: 'skipped', durationMs: 0 },
    anomaly: { status: 'skipped', durationMs: 0 },
    intervention: { status: 'skipped', durationMs: 0 },
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

  // ── Update status to processing ──
  await safeUpdate(prescriptionId, {
    status: 'processing',
    'pipelineStatus.overall': 'processing',
  });

  // ═══════════════════════════════════════════════
  // STEP 1: OCR
  // ═══════════════════════════════════════════════
  try {
    const ocrResult = await callOCR(imagePath);
    ocrText = ocrResult.text || '';
    ocrConfidence = ocrResult.confidence || 0;
    ocrEngine = ocrResult.engine || 'none';
    pipelineStatus.ocr = {
      status: ocrResult.status === 'success' ? 'success' : 'failed',
      error: ocrResult.error,
      durationMs: ocrResult.durationMs,
    };

    await safeUpdate(prescriptionId, {
      ocrText,
      ocrConfidence,
      'metadata.ocrEngine': ocrEngine,
      'pipelineStatus.ocr': pipelineStatus.ocr,
      ...(ocrResult.processedImagePath ? { processedImagePath: ocrResult.processedImagePath } : {}),
    });

    log.info('OCR step done', { status: ocrResult.status, textLen: ocrText.length });
  } catch (err) {
    log.error('OCR step crashed', { error: err.message });
    pipelineStatus.ocr = { status: 'failed', error: err.message, durationMs: 0 };
    await safeUpdate(prescriptionId, { 'pipelineStatus.ocr': pipelineStatus.ocr });
  }

  // ═══════════════════════════════════════════════
  // STEP 2: Rule-based structuring
  // ═══════════════════════════════════════════════
  try {
    const structResult = structureText(ocrText);
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
  // STEP 5: Finalize
  // ═══════════════════════════════════════════════
  const anyFailed = Object.values(pipelineStatus)
    .filter((v) => typeof v === 'object')
    .some((m) => m.status === 'failed');
  const allFailed = Object.values(pipelineStatus)
    .filter((v) => typeof v === 'object')
    .every((m) => m.status === 'failed');

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

module.exports = { runPipeline };
