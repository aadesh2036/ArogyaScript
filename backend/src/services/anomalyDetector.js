/**
 * Rule-based Anomaly Detector
 * Provides fallback anomaly detection when the ML pipeline is unavailable.
 * Checks for: missing dosages, duplicate drugs, extreme dosage, empty prescription, interactions.
 */

const { createLogger } = require('../utils/logger');

const log = createLogger('AnomalyDetector');

// ── Interaction knowledge base (mirrors ml-pipeline/knowledge_base/drug_interactions.yaml) ──
const INTERACTION_DB = [
  { drug1: 'Ibuprofen', drug2: 'Metformin', severity: 'moderate', description: 'NSAIDs may enhance the hypoglycemic effect of Metformin and impair renal function.', recommendation: 'Monitor blood glucose levels closely. Consider alternative analgesic.' },
  { drug1: 'Ibuprofen', drug2: 'Warfarin', severity: 'critical', description: 'NSAIDs significantly increase bleeding risk when combined with anticoagulants.', recommendation: 'Avoid combination. Use Paracetamol as an alternative analgesic.' },
  { drug1: 'Ibuprofen', drug2: 'Amlodipine', severity: 'low', description: 'NSAIDs may reduce antihypertensive effect of calcium channel blockers.', recommendation: 'Monitor blood pressure.' },
  { drug1: 'Ibuprofen', drug2: 'Lisinopril', severity: 'moderate', description: 'NSAIDs reduce ACE inhibitor efficacy and increase nephrotoxicity risk.', recommendation: 'Monitor renal function and blood pressure.' },
  { drug1: 'Metformin', drug2: 'Furosemide', severity: 'moderate', description: 'Loop diuretics may increase risk of lactic acidosis with Metformin.', recommendation: 'Monitor renal function. Adjust Metformin dose if needed.' },
  { drug1: 'Warfarin', drug2: 'Aspirin', severity: 'high', description: 'Increased bleeding risk with concurrent anticoagulant and antiplatelet therapy.', recommendation: 'Avoid unless specifically indicated. Monitor INR closely.' },
  { drug1: 'Warfarin', drug2: 'Omeprazole', severity: 'low', description: 'PPIs may slightly increase Warfarin levels via CYP2C19 inhibition.', recommendation: 'Monitor INR after starting or stopping PPI.' },
  { drug1: 'Atorvastatin', drug2: 'Azithromycin', severity: 'moderate', description: 'Macrolides may increase statin levels, raising risk of myopathy.', recommendation: 'Monitor for muscle pain. Consider temporary statin hold.' },
  { drug1: 'Ciprofloxacin', drug2: 'Tramadol', severity: 'high', description: 'Combined use increases seizure risk significantly.', recommendation: 'Avoid combination. Use alternative antibiotic or analgesic.' },
  { drug1: 'Amlodipine', drug2: 'Simvastatin', severity: 'moderate', description: 'Amlodipine increases Simvastatin levels; risk of rhabdomyolysis.', recommendation: 'Limit Simvastatin to 20mg daily when combined with Amlodipine.' },
  { drug1: 'Metoprolol', drug2: 'Amlodipine', severity: 'low', description: 'Additive hypotensive and bradycardic effects.', recommendation: 'Monitor heart rate and blood pressure.' },
  { drug1: 'Losartan', drug2: 'Enalapril', severity: 'high', description: 'Dual RAAS blockade increases risk of hyperkalemia and renal impairment.', recommendation: 'Avoid combination. Choose one RAAS inhibitor.' },
];

// Extreme dosage thresholds (simplified)
const MAX_DOSAGE_MG = {
  paracetamol: 4000, acetaminophen: 4000, ibuprofen: 2400, amoxicillin: 3000,
  metformin: 2550, atorvastatin: 80, amlodipine: 10, omeprazole: 40,
  warfarin: 10, lisinopril: 80, losartan: 100, metoprolol: 400,
};

/**
 * Run rule-based anomaly detection.
 * @param {{ entities: Array, ocrText: string }}
 * @returns {{ status: string, flags: Array, interactions: Array, riskScore: object }}
 */
function detectAnomalies({ entities, ocrText }) {
  const start = Date.now();
  try {
    const flags = [];
    const interactions = [];

    // ── Check 1: Empty prescription ──
    if (entities.length === 0) {
      flags.push({
        type: 'empty_prescription',
        severity: 'critical',
        message: 'No medications could be extracted from the prescription',
        detail: ocrText ? 'OCR text was available but no drugs were recognized' : 'No OCR text available',
      });
    }

    // ── Check 2: Missing dosage ──
    for (const entity of entities) {
      if (!entity.dosage) {
        flags.push({
          type: 'missing_dosage',
          severity: 'warning',
          message: `Missing dosage for ${entity.drugName}`,
          detail: 'Dosage information could not be extracted',
          drugName: entity.drugName,
        });
      }
      if (!entity.frequency) {
        flags.push({
          type: 'missing_frequency',
          severity: 'info',
          message: `Missing frequency for ${entity.drugName}`,
          detail: 'Frequency information could not be extracted',
          drugName: entity.drugName,
        });
      }
    }

    // ── Check 3: Duplicate drugs ──
    const drugCounts = {};
    for (const entity of entities) {
      const key = entity.drugName.toLowerCase();
      drugCounts[key] = (drugCounts[key] || 0) + 1;
    }
    for (const [drug, count] of Object.entries(drugCounts)) {
      if (count > 1) {
        flags.push({
          type: 'duplicate_drug',
          severity: 'warning',
          message: `Duplicate entry for ${drug} (appears ${count} times)`,
          detail: 'Same medication listed multiple times',
          drugName: drug,
        });
      }
    }

    // ── Check 4: Extreme dosage ──
    for (const entity of entities) {
      if (!entity.dosage) continue;
      const dosageMatch = entity.dosage.match(/(\d+(?:\.\d+)?)\s*mg/i);
      if (!dosageMatch) continue;
      const dosageMg = parseFloat(dosageMatch[1]);
      const maxDosage = MAX_DOSAGE_MG[entity.drugName.toLowerCase()];
      if (maxDosage && dosageMg > maxDosage) {
        flags.push({
          type: 'extreme_dosage',
          severity: 'critical',
          message: `Dosage for ${entity.drugName} (${dosageMg}mg) exceeds recommended maximum (${maxDosage}mg)`,
          detail: 'Dosage significantly exceeds typical maximum daily dose',
          drugName: entity.drugName,
        });
      }
    }

    // ── Check 5: Drug interactions ──
    const drugNames = entities.map((e) => e.drugName.toLowerCase());
    for (const interaction of INTERACTION_DB) {
      const d1 = interaction.drug1.toLowerCase();
      const d2 = interaction.drug2.toLowerCase();
      if (drugNames.includes(d1) && drugNames.includes(d2)) {
        interactions.push(interaction);
        flags.push({
          type: 'drug_interaction',
          severity: interaction.severity === 'critical' ? 'critical' : interaction.severity === 'high' ? 'critical' : 'warning',
          message: `Interaction between ${interaction.drug1} and ${interaction.drug2}: ${interaction.description}`,
          detail: interaction.recommendation,
          drugName: `${interaction.drug1}, ${interaction.drug2}`,
        });
      }
    }

    // ── Compute risk score ──
    const riskScore = computeRiskScore(entities, interactions, flags);

    log.info('Anomaly detection completed', { flagCount: flags.length, interactionCount: interactions.length });

    return {
      status: 'success',
      flags,
      interactions,
      riskScore,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    log.error('Anomaly detection failed', { error: err.message });
    return {
      status: 'failed',
      flags: [],
      interactions: [],
      riskScore: { overall: 0, level: 'safe', signals: [] },
      error: err.message,
      durationMs: Date.now() - start,
    };
  }
}

function computeRiskScore(entities, interactions, flags) {
  let overall = 0;
  const signals = [];
  const interactionWeight = parseFloat(process.env.INTERACTION_WEIGHT) || 0.35;

  // Interaction risk
  if (interactions.length > 0) {
    const weight = interactions.reduce((sum, i) => {
      const w = i.severity === 'critical' ? 40 : i.severity === 'high' ? 30 : i.severity === 'moderate' ? 20 : 10;
      return sum + w;
    }, 0);
    const adjusted = Math.round(weight * interactionWeight);
    overall += adjusted;
    signals.push({ signal: 'drug_interaction', weight: adjusted, detail: `${interactions.length} interaction(s) detected` });
  }

  // Polypharmacy
  if (entities.length >= 5) {
    const w = 15;
    overall += w;
    signals.push({ signal: 'polypharmacy', weight: w, detail: `${entities.length} drugs prescribed (polypharmacy risk)` });
  } else if (entities.length >= 3) {
    const w = 5;
    overall += w;
    signals.push({ signal: 'multiple_drugs', weight: w, detail: `${entities.length} drugs prescribed` });
  }

  // Missing info
  const missingCount = flags.filter((f) => f.type === 'missing_dosage').length;
  if (missingCount > 0) {
    const w = Math.min(missingCount * 5, 20);
    overall += w;
    signals.push({ signal: 'missing_info', weight: w, detail: `${missingCount} drug(s) missing dosage information` });
  }

  // Extreme dosage
  const extremeCount = flags.filter((f) => f.type === 'extreme_dosage').length;
  if (extremeCount > 0) {
    const w = extremeCount * 15;
    overall += w;
    signals.push({ signal: 'extreme_dosage', weight: w, detail: `${extremeCount} drug(s) with extreme dosage` });
  }

  // Empty prescription
  if (flags.some((f) => f.type === 'empty_prescription')) {
    overall += 10;
    signals.push({ signal: 'empty_prescription', weight: 10, detail: 'No medications extracted' });
  }

  overall = Math.min(overall, 100);
  const level = overall <= 10 ? 'safe' : overall <= 25 ? 'low' : overall <= 50 ? 'moderate' : overall <= 75 ? 'high' : 'critical';

  return { overall, level, signals };
}

module.exports = { detectAnomalies };
