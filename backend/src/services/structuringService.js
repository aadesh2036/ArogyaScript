/**
 * Rule-based Structuring Service
 * Extracts drug names, dosages, frequencies, and durations from raw OCR text
 * using regex patterns and a curated drug dictionary.
 */

const { createLogger } = require('../utils/logger');

const log = createLogger('Structuring');

// ── Drug dictionary (mirrors ml-pipeline/knowledge_base/drug_names.yaml) ──
const KNOWN_DRUGS = [
  'Acetaminophen', 'Acyclovir', 'Albuterol', 'Amlodipine', 'Amoxicillin',
  'Aspirin', 'Atenolol', 'Atorvastatin', 'Azithromycin', 'Cetirizine',
  'Ciprofloxacin', 'Clopidogrel', 'Diclofenac', 'Domperidone', 'Enalapril',
  'Fluconazole', 'Furosemide', 'Gabapentin', 'Glimepiride', 'Ibuprofen',
  'Insulin', 'Levothyroxine', 'Lisinopril', 'Losartan', 'Metformin',
  'Metoprolol', 'Montelukast', 'Naproxen', 'Omeprazole', 'Pantoprazole',
  'Paracetamol', 'Prednisolone', 'Ranitidine', 'Rosuvastatin', 'Salbutamol',
  'Sertraline', 'Simvastatin', 'Telmisartan', 'Tramadol', 'Warfarin',
];

// Build case-insensitive lookup
const DRUG_LOOKUP = new Map(KNOWN_DRUGS.map((d) => [d.toLowerCase(), d]));

// ── Regex patterns ──
const DOSAGE_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|units?|tab(?:let)?s?|cap(?:sule)?s?)/gi,
];

const FREQUENCY_PATTERNS = [
  /\b(OD|BD|TDS|QID|SOS|PRN|once\s+daily|twice\s+daily|three\s+times?\s+(?:a\s+)?daily|four\s+times?\s+(?:a\s+)?daily|every\s+\d+\s+hours?|at\s+(?:bed\s*time|night|morning)|before\s+(?:breakfast|lunch|dinner|meals?)|after\s+(?:breakfast|lunch|dinner|meals?))\b/gi,
];

const DURATION_PATTERNS = [
  /\b(?:for\s+)?(\d+)\s*(days?|weeks?|months?|years?)\b/gi,
  /\bx\s*(\d+)\s*(days?|weeks?|months?)\b/gi,
];

/**
 * Extract structured entities from raw OCR text.
 * @param {string} ocrText
 * @returns {{ status: string, entities: Array, rawLineCount: number, error?: string }}
 */
function structureText(ocrText) {
  const start = Date.now();

  try {
    if (!ocrText || ocrText.trim().length === 0) {
      log.warn('Empty OCR text received');
      return { status: 'success', entities: [], rawLineCount: 0, durationMs: Date.now() - start };
    }

    const lines = ocrText.split(/\n/).filter((l) => l.trim().length > 0);
    const entities = [];
    const seenDrugs = new Set();

    // Strategy 1: Line-by-line extraction
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      let foundDrug = null;

      // Check for known drugs in this line
      for (const [drugLower, drugNormalized] of DRUG_LOOKUP) {
        if (lineLower.includes(drugLower)) {
          foundDrug = drugNormalized;
          break;
        }
      }

      if (!foundDrug) continue;

      // Extract dosage from this line
      let dosage = '';
      for (const pattern of DOSAGE_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(line);
        if (match) {
          dosage = match[0];
          break;
        }
      }

      // Extract frequency from this line
      let frequency = '';
      for (const pattern of FREQUENCY_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(line);
        if (match) {
          frequency = match[1] || match[0];
          break;
        }
      }

      // Extract duration from this line (or look at next line)
      let duration = '';
      for (const pattern of DURATION_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(line);
        if (match) {
          duration = `${match[1]} ${match[2]}`;
          break;
        }
      }

      const key = foundDrug.toLowerCase();
      if (!seenDrugs.has(key)) {
        seenDrugs.add(key);
        entities.push({
          drugName: foundDrug,
          rawText: line.trim(),
          dosage: dosage || null,
          frequency: frequency || null,
          duration: duration || null,
          confidence: dosage ? 0.85 : 0.6,
        });
      }
    }

    // Strategy 2: Global scan if no line-by-line matches
    if (entities.length === 0) {
      const fullTextLower = ocrText.toLowerCase();
      for (const [drugLower, drugNormalized] of DRUG_LOOKUP) {
        if (fullTextLower.includes(drugLower)) {
          entities.push({
            drugName: drugNormalized,
            rawText: drugNormalized,
            dosage: null,
            frequency: null,
            duration: null,
            confidence: 0.5,
          });
        }
      }
    }

    log.info('Structuring completed', { entityCount: entities.length, lineCount: lines.length });

    return {
      status: 'success',
      entities,
      rawLineCount: lines.length,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    log.error('Structuring failed', { error: err.message });
    return {
      status: 'failed',
      entities: [],
      rawLineCount: 0,
      error: err.message,
      durationMs: Date.now() - start,
    };
  }
}

module.exports = { structureText, KNOWN_DRUGS, DRUG_LOOKUP };
