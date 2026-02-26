/**
 * Medical Intervention Engine
 * Generates rule-based clinical suggestions based on anomaly flags and interactions.
 */

const { createLogger } = require('../utils/logger');

const log = createLogger('InterventionEngine');

/**
 * Generate interventions from anomaly flags, interactions, and entities.
 * @param {{ flags: Array, interactions: Array, entities: Array }}
 * @returns {{ status: string, interventions: Array, error?: string }}
 */
function generateInterventions({ flags, interactions, entities }) {
  const start = Date.now();
  try {
    const interventions = [];

    // ── Interaction-based interventions ──
    for (const interaction of interactions) {
      const priority =
        interaction.severity === 'critical' ? 'urgent'
          : interaction.severity === 'high' ? 'high'
            : interaction.severity === 'moderate' ? 'medium'
              : 'low';

      interventions.push({
        type: 'consult_physician',
        priority,
        message: `Drug interaction detected: ${interaction.drug1} ↔ ${interaction.drug2}. ${interaction.recommendation}`,
        relatedDrugs: [interaction.drug1, interaction.drug2],
      });
    }

    // ── Missing dosage interventions ──
    const missingDosageFlags = flags.filter((f) => f.type === 'missing_dosage');
    for (const flag of missingDosageFlags) {
      interventions.push({
        type: 'verify_dosage',
        priority: 'medium',
        message: `Dosage not found for ${flag.drugName}. Please verify with the prescribing physician.`,
        relatedDrugs: [flag.drugName],
      });
    }

    // ── Duplicate drug interventions ──
    const dupFlags = flags.filter((f) => f.type === 'duplicate_drug');
    for (const flag of dupFlags) {
      interventions.push({
        type: 'review_duplication',
        priority: 'high',
        message: `${flag.drugName} appears multiple times in the prescription. Review for potential duplication error.`,
        relatedDrugs: [flag.drugName],
      });
    }

    // ── Extreme dosage interventions ──
    const extremeFlags = flags.filter((f) => f.type === 'extreme_dosage');
    for (const flag of extremeFlags) {
      interventions.push({
        type: 'verify_dosage',
        priority: 'urgent',
        message: `${flag.message}. Immediate verification required.`,
        relatedDrugs: [flag.drugName],
      });
    }

    // ── Empty prescription ──
    if (flags.some((f) => f.type === 'empty_prescription')) {
      interventions.push({
        type: 'manual_review',
        priority: 'high',
        message: 'No medications could be extracted. Manual review of the prescription image is recommended.',
        relatedDrugs: [],
      });
    }

    // ── Polypharmacy warning (≥5 drugs) ──
    if (entities.length >= 5) {
      interventions.push({
        type: 'consult_physician',
        priority: 'medium',
        message: `${entities.length} medications detected. Consider a polypharmacy review to minimize adverse effects.`,
        relatedDrugs: entities.map((e) => e.drugName),
      });
    }

    // ── Low confidence OCR ──
    const lowConfidence = entities.filter((e) => e.confidence && e.confidence < 0.6);
    if (lowConfidence.length > 0) {
      interventions.push({
        type: 'manual_review',
        priority: 'medium',
        message: `${lowConfidence.length} medication(s) extracted with low confidence. Manual verification recommended.`,
        relatedDrugs: lowConfidence.map((e) => e.drugName),
      });
    }

    // De-duplicate by type + relatedDrugs combination
    const deduplicated = [];
    const seen = new Set();
    for (const iv of interventions) {
      const key = `${iv.type}:${iv.relatedDrugs.sort().join(',')}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(iv);
      }
    }

    // Sort by priority: urgent > high > medium > low
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    deduplicated.sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4));

    log.info('Interventions generated', { count: deduplicated.length });

    return {
      status: 'success',
      interventions: deduplicated,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    log.error('Intervention engine failed', { error: err.message });
    return {
      status: 'failed',
      interventions: [],
      error: err.message,
      durationMs: Date.now() - start,
    };
  }
}

module.exports = { generateInterventions };
