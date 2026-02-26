/**
 * Pipeline Orchestrator
 *
 * Wires the full Perception → Understanding → Reasoning → Reporting pipeline
 * using the EventBus:
 *
 *   OCR_COMPLETED
 *       → Entity Extraction
 *           → ENTITY_EXTRACTION_COMPLETED
 *               → Drug Interaction Analysis
 *                   → INTERACTION_ANALYZED
 *                       → Risk Scoring
 *                           → RISK_CALCULATED
 *                               → Mark prescription as "processed"
 */
const { eventBus, EVENTS } = require('../utils/eventBus');
const entityService = require('../modules/entities/service');
const interactionService = require('../modules/interaction/service');
const riskService = require('../modules/riskEngine/service');
const prescriptionService = require('../modules/prescriptions/service');
const logger = require('../utils/logger');

// ── Step 2: Entity Extraction (triggered after OCR) ───────────────────────────
eventBus.on(EVENTS.OCR_COMPLETED, async ({ prescription, ocrOutput }) => {
  logger.info(`[Orchestrator] OCR_COMPLETED → Starting entity extraction for ${prescription._id}`);
  try {
    await entityService.extractAndStoreEntities(prescription, ocrOutput);
  } catch (err) {
    logger.error(`[Orchestrator] Entity extraction failed: ${err.message}`);
    await prescriptionService.updateStatus(prescription._id, 'failed', err.message);
  }
});

// ── Step 3: Drug Interactions (triggered after entity extraction) ─────────────
eventBus.on(EVENTS.ENTITY_EXTRACTION_COMPLETED, async ({ prescription, entityDoc }) => {
  logger.info(`[Orchestrator] ENTITY_EXTRACTION_COMPLETED → Starting interaction analysis for ${prescription._id}`);
  try {
    await interactionService.analyzeInteractions(prescription, entityDoc);
  } catch (err) {
    logger.error(`[Orchestrator] Interaction analysis failed: ${err.message}`);
    await prescriptionService.updateStatus(prescription._id, 'failed', err.message);
  }
});

// ── Step 4: Risk Engine (triggered after interactions) ────────────────────────
eventBus.on(EVENTS.INTERACTION_ANALYZED, async ({ prescription }) => {
  logger.info(`[Orchestrator] INTERACTION_ANALYZED → Computing risk score for ${prescription._id}`);
  try {
    await riskService.computeRiskScore(prescription);
  } catch (err) {
    logger.error(`[Orchestrator] Risk scoring failed: ${err.message}`);
    await prescriptionService.updateStatus(prescription._id, 'failed', err.message);
  }
});

// ── Step 5: Mark as processed ─────────────────────────────────────────────────
eventBus.on(EVENTS.RISK_CALCULATED, async ({ prescription }) => {
  logger.info(`[Orchestrator] Pipeline complete → marking prescription ${prescription._id} as processed`);
  await prescriptionService.updateStatus(prescription._id, 'processed');
});

// ── Pipeline Failure Handler ──────────────────────────────────────────────────
eventBus.on(EVENTS.PIPELINE_FAILED, ({ prescription, error }) => {
  logger.error(`[Orchestrator] Pipeline FAILED for ${prescription._id}: ${error}`);
});

logger.info('[Orchestrator] Pipeline event listeners registered.');
