/**
 * Reasoning Service
 * Abstraction layer that orchestrates explainable reasoning generation.
 *
 * Provider chain:
 *   GroqProvider → RuleFallbackProvider
 *
 * If Groq succeeds and returns valid JSON → use Groq output.
 * If Groq fails OR JSON invalid → fallback to rule-based reasoning.
 *
 * This module is NEVER critical — pipeline continues on any failure.
 * Handles its own DB persistence (mirrors previous geminiClient behavior).
 */

const Prescription = require('../../models/Prescription.model');
const { callGroq, buildReasoningPayload, REASONING_VERSION } = require('./groqProvider');
const { createLogger } = require('../../utils/logger');

const log = createLogger('ReasoningService');

// ═══════════════════════════════════════════════════════════
// RULE-BASED FALLBACK PROVIDER
// ═══════════════════════════════════════════════════════════

/**
 * Generate rule-based fallback reasoning when Groq is unavailable.
 * Uses existing interaction/anomaly data to build explanation objects
 * in the Groq output schema format.
 *
 * @param {object} payload - structured reasoning payload
 * @returns {object} fallback reasoning in the standard output schema
 */
function buildRuleFallback(payload) {
  const {
    extracted_drugs = [],
    drug_interactions = [],
    anomaly_signals = [],
    rule_engine_outputs = [],
  } = payload;

  // Build interaction explanations from KB data
  const interaction_explanations = drug_interactions.map((intr) => ({
    pair: `${intr.drugA} + ${intr.drugB}`,
    severity: intr.severity || 'unknown',
    reason: intr.description
      ? `${intr.description} ${intr.recommendation || ''}`.trim()
      : 'Mechanism not available (AI reasoning offline)',
  }));

  // Build anomaly explanations from flags
  const anomaly_explanations = anomaly_signals.map((sig) => ({
    type: sig.type,
    reason: sig.message || 'See anomaly flag for details. AI explanation unavailable.',
  }));

  // Build interventions from rule engine outputs
  const interventions = rule_engine_outputs.map((iv) => ({
    action: iv.message || 'Review required',
    rationale: `Rule-based: ${iv.type} (${iv.priority} priority)`,
  }));

  // Add critical interaction intervention if not already present
  const criticalInteractions = drug_interactions.filter(
    (i) => i.severity === 'critical' || i.severity === 'high'
  );
  if (criticalInteractions.length > 0 && !interventions.some((iv) => iv.action.includes('interaction'))) {
    interventions.unshift({
      action: `${criticalInteractions.length} high-severity drug interaction(s) detected. Immediate physician review required.`,
      rationale: 'KB-based interaction severity classification',
    });
  }

  const drugNames = extracted_drugs.map((d) => d.name).filter(Boolean);
  const summary = drugNames.length > 0
    ? `Prescription contains ${drugNames.length} medication(s): ${drugNames.join(', ')}. ` +
      `${drug_interactions.length} interaction(s) and ${anomaly_signals.length} anomaly signal(s) detected via rule-based analysis. ` +
      `AI explanation unavailable — fallback mode active.`
    : 'No medications could be extracted. Manual review required. AI explanation unavailable.';

  return {
    summary,
    interaction_explanations,
    anomaly_explanations,
    interventions,
  };
}

// ═══════════════════════════════════════════════════════════
// TRANSFORM TO LEGACY FORMAT
// ═══════════════════════════════════════════════════════════

/**
 * Transform the Groq/fallback reasoning output into the legacy
 * geminiReasoning schema format used by the Prescription model
 * and frontend UI.
 *
 * This ensures backward compatibility — the DB schema and API
 * responses remain unchanged.
 *
 * @param {object} reasoning - Groq or fallback output
 * @param {object} payload - original pipeline payload
 * @param {string} status - 'success' | 'failed' | 'skipped'
 * @param {string} provider - 'groq' | 'rule_fallback'
 * @returns {object} legacy-format reasoning object
 */
function transformToLegacyFormat(reasoning, payload, status, provider) {
  const { drug_interactions = [], anomaly_signals = [], extracted_drugs = [] } = payload;

  // Map Groq interaction_explanations → legacy gemini format
  const interaction_explanations = (reasoning.interaction_explanations || []).map((ie) => {
    const drugs = (ie.pair || '').split(/\s*\+\s*/);
    return {
      drugA: drugs[0] || '',
      drugB: drugs[1] || '',
      severity: ie.severity || 'unknown',
      mechanism: ie.reason || '',
      clinical_significance: ie.reason || '',
      evidence_basis: provider === 'groq' ? 'Groq LLM reasoning' : 'Rule-based knowledge base',
      uncertain: provider !== 'groq',
    };
  });

  // Map Groq anomaly_explanations → legacy format
  const anomaly_explanations = (reasoning.anomaly_explanations || []).map((ae) => {
    // Try to match back to original signal for score
    const matchedSignal = anomaly_signals.find((s) => s.type === ae.type);
    return {
      signal_name: ae.type || '',
      score: matchedSignal
        ? (matchedSignal.severity === 'critical' ? 0.9 : matchedSignal.severity === 'warning' ? 0.65 : 0.3)
        : 0,
      clinical_meaning: ae.reason || '',
      suggested_cause: ae.reason || '',
      uncertain: provider !== 'groq',
    };
  });

  // Map Groq interventions → legacy format
  const interventions = (reasoning.interventions || []).map((iv) => ({
    priority: 'medium',
    action_type: 'manual_review',
    message: iv.action || '',
    related_drugs: extracted_drugs.map((d) => d.name).filter(Boolean),
    evidence: iv.rationale || '',
  }));

  return {
    explainability_summary: reasoning.summary || '',
    interaction_explanations,
    anomaly_explanations,
    interventions,
    uncertainty_flags: provider !== 'groq'
      ? [{
          field: 'all_reasoning_outputs',
          reason: 'Groq API unavailable — fallback rule-based explanations used',
          impact: 'Explanations are less context-aware; manual clinical review recommended',
        }]
      : [],
    ocr_uncertainty_flags: [],
    entity_reconciliation: {
      missing_fields: [],
      ambiguous_entities: [],
      notes: provider !== 'groq' ? 'AI reasoning offline — entity reconciliation not available' : '',
    },
    gemini_status: status,
    reasoning_version: REASONING_VERSION,
  };
}

// ═══════════════════════════════════════════════════════════
// MONGO PERSISTENCE
// ═══════════════════════════════════════════════════════════

/**
 * Persist reasoning output to the prescription document.
 * Mirrors the previous geminiClient persistence logic.
 */
async function persistReasoningResult(prescriptionId, legacyReasoning, durationMs, errorMsg) {
  try {
    await Prescription.findOneAndUpdate(
      { prescriptionId },
      {
        $set: {
          geminiReasoning: {
            explainability_summary: legacyReasoning.explainability_summary || '',
            interaction_explanations: legacyReasoning.interaction_explanations || [],
            anomaly_explanations: legacyReasoning.anomaly_explanations || [],
            interventions: legacyReasoning.interventions || [],
            uncertainty_flags: legacyReasoning.uncertainty_flags || [],
            ocr_uncertainty_flags: legacyReasoning.ocr_uncertainty_flags || [],
            entity_reconciliation: legacyReasoning.entity_reconciliation || {},
            gemini_status: legacyReasoning.gemini_status,
            reasoning_version: REASONING_VERSION,
            durationMs,
            error: errorMsg || null,
            generatedAt: new Date(),
          },
          'pipelineStatus.gemini': {
            status: legacyReasoning.gemini_status === 'success' ? 'success' : 'failed',
            error: errorMsg || null,
            durationMs,
          },
        },
      },
      { new: true }
    );
    log.info('Reasoning result persisted', { prescriptionId, status: legacyReasoning.gemini_status });
  } catch (err) {
    log.error('Failed to persist reasoning result', { prescriptionId, error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORTED FUNCTION
// ═══════════════════════════════════════════════════════════

/**
 * Run explainable reasoning and persist output to MongoDB.
 * NEVER throws — always returns a result (success or fallback).
 *
 * Provider chain: GroqProvider → RuleFallbackProvider
 *
 * @param {object} params
 * @param {string} params.prescriptionId
 * @param {string} params.ocrText
 * @param {Array}  params.entities
 * @param {Array}  params.interactions
 * @param {Array}  params.anomalyFlags
 * @param {Array}  [params.interventions] - rule engine interventions
 * @returns {object} reasoning result (legacy format)
 */
async function runReasoning({ prescriptionId, ocrText, entities, interactions, anomalyFlags, interventions }) {
  const start = Date.now();

  // Build structured payload
  const payload = buildReasoningPayload({
    prescriptionId,
    ocrText,
    entities,
    interactions,
    anomalyFlags,
    interventions,
  });

  // Check if reasoning is disabled via environment
  const reasoningEnabled = process.env.REASONING_ENABLED !== 'false';
  if (!reasoningEnabled) {
    log.info('Reasoning disabled via REASONING_ENABLED=false', { prescriptionId });
    const fallbackData = buildRuleFallback(payload);
    const legacy = transformToLegacyFormat(fallbackData, payload, 'skipped', 'rule_fallback');
    await persistReasoningResult(prescriptionId, legacy, Date.now() - start);
    return legacy;
  }

  // ── Try Groq Provider ──
  let provider = 'groq';
  let reasoning;
  let errorMsg = null;

  const groqResult = await callGroq({
    payload,
    maxRetries: parseInt(process.env.GROQ_MAX_RETRIES || '2', 10),
    timeoutMs: parseInt(process.env.GROQ_TIMEOUT_MS || '15000', 10),
  });

  if (groqResult.success && groqResult.data) {
    reasoning = groqResult.data;
    log.info('Reasoning completed via Groq', {
      prescriptionId,
      provider: 'groq',
      latencyMs: groqResult.latencyMs,
    });
  } else {
    // ── Fallback to rule-based reasoning ──
    provider = 'rule_fallback';
    errorMsg = groqResult.error;

    log.warn('Groq failed — falling back to rule-based reasoning', {
      prescriptionId,
      error: groqResult.error,
      latencyMs: groqResult.latencyMs,
      fallbackTrigger: true,
    });

    reasoning = buildRuleFallback(payload);
  }

  // Transform to legacy format for backward compatibility
  const status = provider === 'groq' ? 'success' : 'failed';
  const legacy = transformToLegacyFormat(reasoning, payload, status, provider);
  const durationMs = Date.now() - start;

  log.info('Reasoning service complete', {
    prescriptionId,
    provider,
    status,
    latencyMs: durationMs,
    fallbackTrigger: provider !== 'groq',
  });

  await persistReasoningResult(prescriptionId, legacy, durationMs, errorMsg);
  return legacy;
}

module.exports = {
  runReasoning,
  buildRuleFallback,
  transformToLegacyFormat,
  REASONING_VERSION,
};
