const { RiskScore, RiskReason } = require('./model');
const OcrOutput = require('../ocr/model');
const Entity = require('../entities/model');
const { InteractionResult } = require('../interaction/model');
const ConfigVersion = require('../configVersioning/model');
const analyticsService = require('../analytics/service');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

/**
 * Risk Signals with weights (configurable via ConfigVersion)
 * Signals:
 *  - Low OCR confidence           → weight: INTERACTION_WEIGHT config or 0.30
 *  - Missing dosage               → weight: 0.25
 *  - High-severity interaction    → weight: 0.35
 *  - Missing metadata             → weight: 0.10
 */
const computeRiskScore = async (prescription) => {
  try {
    logger.info(`[RiskEngine] Computing risk for prescription: ${prescription._id}`);
    const factors = [];
    let totalWeight = 0;

    // Load latest config
    const config = await ConfigVersion.findById(prescription.configVersionId)
      || await ConfigVersion.findOne().sort({ createdAt: -1 });

    const ocrConfidenceThreshold = config?.ocrConfidenceThreshold
      ?? parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) ?? 0.75;
    const interactionWeight = config?.interactionWeight
      ?? parseFloat(process.env.INTERACTION_WEIGHT) ?? 0.35;
    const configVersionId = config?._id ?? null;

    // ── Signal 1: Low OCR Confidence ─────────────────────────────────────────
    const ocrDoc = await OcrOutput.findOne({ prescriptionId: prescription._id });
    if (ocrDoc && ocrDoc.averageConfidence < ocrConfidenceThreshold) {
      const weight = 0.30;
      totalWeight += weight;
      factors.push({
        type: 'LOW_OCR_CONFIDENCE',
        description: `Average OCR confidence (${ocrDoc.averageConfidence.toFixed(2)}) below threshold (${ocrConfidenceThreshold})`,
        weight,
        evidenceReference: `OcrOutput:${ocrDoc._id}`,
        sourceModule: 'OCR',
      });
    }

    // ── Signal 2: Missing Dosage ──────────────────────────────────────────────
    const entityDoc = await Entity.findOne({ prescriptionId: prescription._id });
    const drugsWithoutDosage = (entityDoc?.drugs || []).filter((d) => !d.strength);
    if (drugsWithoutDosage.length > 0) {
      const weight = 0.25;
      totalWeight += weight;
      factors.push({
        type: 'MISSING_DOSAGE',
        description: `${drugsWithoutDosage.length} drug(s) have no dosage information: ${drugsWithoutDosage.map((d) => d.rawName).join(', ')}`,
        weight,
        evidenceReference: `Entity:${entityDoc?._id}`,
        sourceModule: 'Entity',
      });
    }

    // ── Signal 3: High-Severity Interaction ──────────────────────────────────
    const interactionDoc = await InteractionResult.findOne({ prescriptionId: prescription._id });
    const highSeverity = (interactionDoc?.interactions || []).filter((i) => i.severity === 'high');
    if (highSeverity.length > 0) {
      totalWeight += interactionWeight;
      factors.push({
        type: 'HIGH_SEVERITY_INTERACTION',
        description: `${highSeverity.length} high-severity drug interaction(s): ${highSeverity.map((i) => `${i.drugA}↔${i.drugB}`).join(', ')}`,
        weight: interactionWeight,
        evidenceReference: `InteractionResult:${interactionDoc?._id}`,
        sourceModule: 'Interaction',
      });
    }

    // ── Signal 4: Missing Metadata ────────────────────────────────────────────
    const missingMeta = !entityDoc?.doctorName || !entityDoc?.patientName;
    if (missingMeta) {
      const weight = 0.10;
      totalWeight += weight;
      factors.push({
        type: 'MISSING_METADATA',
        description: `Missing: ${[!entityDoc?.doctorName && 'doctorName', !entityDoc?.patientName && 'patientName'].filter(Boolean).join(', ')}`,
        weight,
        evidenceReference: `Entity:${entityDoc?._id ?? 'none'}`,
        sourceModule: 'Entity',
      });
    }

    // ── Score Calculation ─────────────────────────────────────────────────────
    const normalizedMax = 0.30 + 0.25 + interactionWeight + 0.10;
    const overallScore = Math.min(100, Math.round((totalWeight / normalizedMax) * 100));
    const category = overallScore < 30 ? 'low' : overallScore < 70 ? 'moderate' : 'high';

    // Persist
    const riskScoreDoc = await RiskScore.findOneAndUpdate(
      { prescriptionId: prescription._id },
      { prescriptionId: prescription._id, overallScore, category, configVersionId },
      { upsert: true, new: true }
    );

    await RiskReason.findOneAndUpdate(
      { prescriptionId: prescription._id },
      { prescriptionId: prescription._id, factors },
      { upsert: true, new: true }
    );

    await analyticsService.logEvent('RISK_CALCULATED', prescription._id, {
      overallScore,
      category,
      factorCount: factors.length,
    });

    eventBus.emit(EVENTS.RISK_CALCULATED, { prescription, riskScoreDoc });
    logger.info(`[RiskEngine] Score: ${overallScore} (${category}) for prescription: ${prescription._id}`);
    return { riskScoreDoc, factors };
  } catch (err) {
    logger.error(`[RiskEngine] Failed for ${prescription._id}: ${err.message}`);
    throw err;
  }
};

const getRiskSummary = async (prescriptionId) => {
  const score = await RiskScore.findOne({ prescriptionId });
  const reasons = await RiskReason.findOne({ prescriptionId });
  return { score, reasons };
};

module.exports = { computeRiskScore, getRiskSummary };
