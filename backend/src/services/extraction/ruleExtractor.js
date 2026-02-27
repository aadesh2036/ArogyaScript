/**
 * Enhanced Rule-Based Entity Extractor
 * Extracts structured prescription entities from noisy OCR text using
 * robust regex patterns, line grouping, and confidence scoring.
 *
 * Extracted fields per medication:
 *   drug_name, dosage_strength, dosage_form, frequency, duration, intake_instruction
 *
 * Handles OCR noise: spacing errors, missing punctuation, token reordering.
 */

const { createLogger } = require('../../utils/logger');

const log = createLogger('RuleExtractor');

// ═══════════════════════════════════════════════════════════
// DRUG DICTIONARY
// ═══════════════════════════════════════════════════════════

const KNOWN_DRUGS = [
  'Acetaminophen', 'Acyclovir', 'Albuterol', 'Amlodipine', 'Amoxicillin',
  'Aspirin', 'Atenolol', 'Atorvastatin', 'Azithromycin', 'Cetirizine',
  'Ciprofloxacin', 'Clopidogrel', 'Diclofenac', 'Domperidone', 'Enalapril',
  'Fluconazole', 'Furosemide', 'Gabapentin', 'Glimepiride', 'Ibuprofen',
  'Insulin', 'Levothyroxine', 'Lisinopril', 'Losartan', 'Metformin',
  'Metoprolol', 'Montelukast', 'Naproxen', 'Omeprazole', 'Pantoprazole',
  'Paracetamol', 'Prednisolone', 'Ranitidine', 'Rosuvastatin', 'Salbutamol',
  'Sertraline', 'Simvastatin', 'Telmisartan', 'Tramadol', 'Warfarin',
  // Extended set — common Indian prescriptions
  'Cefixime', 'Ceftriaxone', 'Clarithromycin', 'Doxycycline', 'Erythromycin',
  'Levofloxacin', 'Metronidazole', 'Norfloxacin', 'Ofloxacin',
  'Chlorpheniramine', 'Fexofenadine', 'Hydroxyzine', 'Loratadine',
  'Rabeprazole', 'Esomeprazole', 'Famotidine', 'Sucralfate',
  'Nifedipine', 'Ramipril', 'Valsartan', 'Hydrochlorothiazide',
  'Carvedilol', 'Propranolol', 'Diltiazem', 'Verapamil',
  'Glipizide', 'Gliclazide', 'Pioglitazone', 'Sitagliptin', 'Vildagliptin',
  'Cough Relief', 'Multivitamin', 'Calcium', 'Iron', 'Folic Acid',
  'Vitamin D', 'Vitamin B12', 'Zinc', 'Probiotics',
];

const DRUG_LOOKUP = new Map(KNOWN_DRUGS.map((d) => [d.toLowerCase(), d]));

// Build regex from drug names for matching (sorted longest-first to avoid partial matches)
const DRUG_REGEX = new RegExp(
  '\\b(' + [...KNOWN_DRUGS].sort((a, b) => b.length - a.length).map(escapeRegex).join('|') + ')\\b',
  'gi'
);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════
// DOSAGE FORM PATTERNS
// ═══════════════════════════════════════════════════════════

const DOSAGE_FORM_MAP = {
  'tab': 'Tablet', 'tabs': 'Tablet', 'tablet': 'Tablet', 'tablets': 'Tablet',
  'cap': 'Capsule', 'caps': 'Capsule', 'capsule': 'Capsule', 'capsules': 'Capsule',
  'syp': 'Syrup', 'syr': 'Syrup', 'syrup': 'Syrup',
  'inj': 'Injection', 'injection': 'Injection',
  'drops': 'Drops', 'drop': 'Drops',
  'oint': 'Ointment', 'ointment': 'Ointment',
  'cream': 'Cream', 'gel': 'Gel',
  'susp': 'Suspension', 'suspension': 'Suspension',
  'inh': 'Inhaler', 'inhaler': 'Inhaler',
  'sachet': 'Sachet', 'powder': 'Powder',
};

const DOSAGE_FORM_REGEX = new RegExp(
  '\\b(' + Object.keys(DOSAGE_FORM_MAP).sort((a, b) => b.length - a.length).join('|') + ')\\b',
  'gi'
);

// ═══════════════════════════════════════════════════════════
// DOSAGE STRENGTH PATTERNS
// ═══════════════════════════════════════════════════════════

// Matches: "500 mg", "500mg", "5 ml", "0.5mg", "250 mcg", "100 iu"
const DOSAGE_STRENGTH_REGEX = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|units?|%)\b/gi;

// Also catch standalone numeric+unit combos like "500mg" with no space
const DOSAGE_STRENGTH_TIGHT = /(\d+(?:\.\d+)?)(mg|mcg|ml|g)\b/gi;

// ═══════════════════════════════════════════════════════════
// FREQUENCY PATTERNS
// ═══════════════════════════════════════════════════════════

const FREQUENCY_PATTERNS = [
  // Dose schedules like 1-0-1, 1-1-1, 0-0-1, 1-0-0
  { regex: /\b([012])\s*[-–]\s*([012])\s*[-–]\s*([012])\b/g, normalize: (m) => `${m[1]}-${m[2]}-${m[3]}` },
  // Latin abbreviations
  { regex: /\b(OD|o\.?d\.?)\b/gi, normalize: () => 'OD (once daily)' },
  { regex: /\b(BD|b\.?d\.?|BID|b\.?i\.?d\.?)\b/gi, normalize: () => 'BD (twice daily)' },
  { regex: /\b(TDS|t\.?d\.?s\.?|TID|t\.?i\.?d\.?)\b/gi, normalize: () => 'TDS (three times daily)' },
  { regex: /\b(QID|q\.?i\.?d\.?|QDS|q\.?d\.?s\.?)\b/gi, normalize: () => 'QID (four times daily)' },
  { regex: /\b(SOS|s\.?o\.?s\.?|PRN|p\.?r\.?n\.?)\b/gi, normalize: () => 'SOS (as needed)' },
  { regex: /\b(HS|h\.?s\.?|at\s+(?:bed\s*time|night))\b/gi, normalize: () => 'HS (at bedtime)' },
  // English phrases
  { regex: /\bonce\s+(?:a\s+)?dai?ly\b/gi, normalize: () => 'once daily' },
  { regex: /\btwice\s+(?:a\s+)?dai?ly\b/gi, normalize: () => 'twice daily' },
  { regex: /\bthree\s+times?\s+(?:a\s+)?dai?ly\b/gi, normalize: () => 'three times daily' },
  { regex: /\bfour\s+times?\s+(?:a\s+)?dai?ly\b/gi, normalize: () => 'four times daily' },
  { regex: /\bevery\s+(\d+)\s*(?:hr|hour)s?\b/gi, normalize: (m) => `every ${m[1]} hours` },
  { regex: /\b(?:in\s+the\s+)?morning\s+(?:and\s+)?(?:evening|night)\b/gi, normalize: () => 'morning and evening' },
  { regex: /\bstat\b/gi, normalize: () => 'STAT (immediately)' },
];

// ═══════════════════════════════════════════════════════════
// DURATION PATTERNS
// ═══════════════════════════════════════════════════════════

const DURATION_PATTERNS = [
  // "for 5 days", "for 1 week", "x 7 days"
  { regex: /\b(?:for|x|×)\s*(\d+)\s*(days?|weeks?|months?|years?)\b/gi, normalize: (m) => `${m[1]} ${m[2].toLowerCase()}` },
  // "5 days", "7 days" — standalone
  { regex: /\b(\d+)\s*(days?|weeks?|months?)\b/gi, normalize: (m) => `${m[1]} ${m[2].toLowerCase()}` },
  // "1/52" = 1 week, "2/12" = 2 months (medical shorthand)
  { regex: /\b(\d+)\s*\/\s*52\b/g, normalize: (m) => `${m[1]} weeks` },
  { regex: /\b(\d+)\s*\/\s*12\b/g, normalize: (m) => `${m[1]} months` },
];

// ═══════════════════════════════════════════════════════════
// INTAKE INSTRUCTION PATTERNS
// ═══════════════════════════════════════════════════════════

const INTAKE_PATTERNS = [
  { regex: /\b(?:before|bf)\s+(?:food|meals?)\b/gi, normalize: () => 'before food' },
  { regex: /\b(?:after|af)\s+(?:food|meals?)\b/gi, normalize: () => 'after food' },
  { regex: /\bbefore\s+breakfast\b/gi, normalize: () => 'before breakfast' },
  { regex: /\bafter\s+breakfast\b/gi, normalize: () => 'after breakfast' },
  { regex: /\bbefore\s+(?:lunch|dinner)\b/gi, normalize: (m) => m[0].toLowerCase() },
  { regex: /\bafter\s+(?:lunch|dinner)\b/gi, normalize: (m) => m[0].toLowerCase() },
  { regex: /\b(?:on|with)\s+(?:an?\s+)?empty\s+stomach\b/gi, normalize: () => 'empty stomach' },
  { regex: /\bwith\s+(?:food|meals?|water|milk)\b/gi, normalize: (m) => m[0].toLowerCase() },
  { regex: /\bat\s+(?:bed\s*time|night)\b/gi, normalize: () => 'at bedtime' },
  { regex: /\b(?:ac|a\.?c\.?)\b/gi, normalize: () => 'before food' },
  { regex: /\b(?:pc|p\.?c\.?)\b/gi, normalize: () => 'after food' },
];

// ═══════════════════════════════════════════════════════════
// STOPWORDS — filter these from drug name candidates
// ═══════════════════════════════════════════════════════════

const STOPWORDS = new Set([
  // Dosage form tokens
  'tab', 'tabs', 'tablet', 'tablets', 'cap', 'caps', 'capsule', 'capsules',
  'syp', 'syr', 'syrup', 'inj', 'injection', 'drops', 'drop',
  // Units
  'mg', 'mcg', 'ml', 'g', 'iu', 'units', 'unit',
  // Frequency abbreviations
  'od', 'bd', 'tds', 'tid', 'qid', 'sos', 'prn', 'hs', 'stat',
  'daily', 'once', 'twice', 'three', 'four', 'times', 'a',
  // Duration / temporal
  'for', 'days', 'day', 'weeks', 'week', 'months', 'month',
  // Intake instructions
  'before', 'after', 'food', 'meals', 'meal', 'breakfast', 'lunch', 'dinner',
  'empty', 'stomach', 'with', 'water', 'milk', 'at', 'night', 'bedtime',
  'morning', 'evening',
  // Common articles / conjunctions
  'and', 'or', 'the', 'of', 'in', 'on', 'to', 'an', 'is', 'are', 'was',
  'has', 'have', 'had', 'not', 'but', 'this', 'that', 'from', 'been', 'also',
  // Prescription header tokens
  'rx', 'no', 'dr', 'mr', 'mrs', 'ms', 'patient', 'name', 'age', 'date',
  'sig', 'disp', 'refill', 'qty', 'take', 'use', 'apply',
  // Hospital / clinic header words
  'hospital', 'clinic', 'centre', 'center', 'medical', 'health', 'healthcare',
  'multispeciality', 'multispeciality', 'multi', 'speciality', 'specialty',
  'nursing', 'home', 'trust', 'foundation', 'institute', 'university',
  'laboratory', 'labs', 'lab', 'diagnostics', 'diagnostic', 'pharmacy',
  'surgical', 'orthopedic', 'orthopaedic', 'dental', 'eye', 'skin',
  'general', 'private', 'govt', 'government', 'municipal', 'district',
  'sunrise', 'apollo', 'fortis', 'max', 'medanta', 'manipal', 'narayana',
  // Doctor / patient demographic header words
  'doctor', 'physician', 'surgeon', 'consultant', 'prof', 'professor',
  'mbbs', 'md', 'frcs', 'mrcp', 'dnb', 'diploma', 'degree', 'registration',
  'reg', 'agesex', 'gender', 'male', 'female', 'years', 'year', 'yrs',
  'address', 'phone', 'tel', 'mobile', 'email', 'fax', 'contact',
  'opd', 'ipd', 'ward', 'bed', 'room', 'department', 'dept',
  // City / location words
  'mumbai', 'delhi', 'pune', 'bangalore', 'bengaluru', 'chennai', 'kolkata',
  'hyderabad', 'ahmedabad', 'jaipur', 'lucknow', 'nagpur', 'indore',
  'bhopal', 'surat', 'vadodara', 'thane', 'navi', 'road', 'street',
  'nagar', 'colony', 'sector', 'block', 'plot', 'near', 'opposite',
  // Common names that appear in prescriptions as doctor/patient names
  'rohan', 'amit', 'rahul', 'priya', 'neha', 'kumar', 'sharma', 'patel',
  'singh', 'gupta', 'verma', 'jain', 'shah', 'mehta', 'khan', 'reddy',
  // Misc prescription terms
  'prescription', 'diagnosis', 'complaints', 'history', 'examination',
  'investigation', 'treatment', 'advice', 'follow', 'review', 'next',
  'visit', 'signed', 'signature', 'stamp', 'seal',
]);

/**
 * Additional blocklist patterns tested against full word.
 * If the word matches any of these regex patterns, it's blocked.
 */
const HEADER_BLOCK_PATTERNS = [
  /^dr\.?$/i,                          // "Dr.", "Dr"
  /^(?:mr|mrs|ms|shri|smt)\.?$/i,     // Honorifics
  /^\d{2,}$/,                           // Pure numbers like "400012" (PIN codes)
  /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/, // Dates: 27/02/2026 etc.
  /^(?:age|sex|m|f)[\/:]?$/i,           // age/sex markers
  /^[a-z]{1,2}$/i,                      // Single/double letter tokens
  /^(?:ph|tel|mob|fax|email)[\.:]?$/i,  // Phone/email labels
  /^\d+(?:mg|ml|mcg|g|iu)?$/i,         // Standalone numbers with optional unit
];

// ═══════════════════════════════════════════════════════════
// LINE GROUPING
// ═══════════════════════════════════════════════════════════

/**
 * Split OCR text into medication lines.
 * Uses multiple segmentation strategies:
 *   1. Newline splitting
 *   2. Numbering markers (1., 2., ●, -, etc.)
 *   3. Dosage form tokens as line boundaries
 *
 * @param {string} ocrText
 * @returns {string[]} medication lines
 */
function groupIntoMedicationLines(ocrText) {
  if (!ocrText || !ocrText.trim()) return [];

  // Step 1: Split on newlines
  let lines = ocrText.split(/\n/).map((l) => l.trim()).filter(Boolean);

  // Step 2: Further split on numbering markers within lines
  // e.g. "1. Tab Paracetamol 500mg 2. Cap Amoxicillin 500mg"
  const numberedSplit = [];
  for (const line of lines) {
    const parts = line.split(/(?=(?:^|\s)\d+\s*[.)]\s)/);
    for (const part of parts) {
      const cleaned = part.replace(/^\s*\d+\s*[.)]\s*/, '').trim();
      if (cleaned) numberedSplit.push(cleaned);
    }
  }
  lines = numberedSplit.length > lines.length ? numberedSplit : lines;

  // Step 3: Split on bullet markers (●, •, -, ★, ►)
  const bulletSplit = [];
  for (const line of lines) {
    const parts = line.split(/(?=\s*[●•\-★►]\s)/);
    for (const part of parts) {
      const cleaned = part.replace(/^\s*[●•\-★►]\s*/, '').trim();
      if (cleaned) bulletSplit.push(cleaned);
    }
  }
  lines = bulletSplit.length > lines.length ? bulletSplit : lines;

  // Step 4: Split when a dosage form token appears mid-line
  // e.g. "Tab Paracetamol 500mg Tab Amoxicillin 250mg" on one line
  const formSplit = [];
  const formBoundaryRegex = /(?=\b(?:tab|tabs|tablet|tablets|cap|caps|capsule|capsules|syp|syr|syrup|inj|injection|drops?)\s)/gi;
  for (const line of lines) {
    const parts = line.split(formBoundaryRegex).map((p) => p.trim()).filter(Boolean);
    formSplit.push(...parts);
  }
  lines = formSplit.length > lines.length ? formSplit : lines;

  // Step 5: Also try splitting on drug dictionary matches if a single line has 2+ drugs
  const multiDrugSplit = [];
  for (const line of lines) {
    const drugMatches = [];
    DRUG_REGEX.lastIndex = 0;
    let dm;
    while ((dm = DRUG_REGEX.exec(line)) !== null) {
      drugMatches.push({ index: dm.index, name: dm[0] });
    }
    if (drugMatches.length > 1) {
      // Split at drug name boundaries
      for (let i = 0; i < drugMatches.length; i++) {
        const start = drugMatches[i].index;
        const end = i + 1 < drugMatches.length ? drugMatches[i + 1].index : line.length;
        const segment = line.slice(start, end).trim();
        if (segment) multiDrugSplit.push(segment);
      }
      // Prepend any text before the first drug match
      const prefix = line.slice(0, drugMatches[0].index).trim();
      if (prefix && prefix.length > 3) {
        multiDrugSplit.unshift(prefix);
      }
    } else {
      multiDrugSplit.push(line);
    }
  }

  return multiDrugSplit.length > 0 ? multiDrugSplit : lines;
}

// ═══════════════════════════════════════════════════════════
// SINGLE-LINE ENTITY EXTRACTOR
// ═══════════════════════════════════════════════════════════

/**
 * Extract a structured entity from a single medication line.
 * @param {string} line
 * @returns {object|null} extracted entity or null
 */
function extractFromLine(line) {
  if (!line || line.trim().length < 3) return null;

  const result = {
    drug_name: null,
    dosage_strength: null,
    dosage_form: null,
    frequency: null,
    duration: null,
    intake_instruction: null,
    _field_sources: {},  // track which fields were extracted
    _raw_line: line.trim(),
  };

  // ── Dosage form ──
  DOSAGE_FORM_REGEX.lastIndex = 0;
  const formMatch = DOSAGE_FORM_REGEX.exec(line);
  if (formMatch) {
    result.dosage_form = DOSAGE_FORM_MAP[formMatch[1].toLowerCase()] || formMatch[1];
    result._field_sources.dosage_form = 'rule';
  }

  // ── Dosage strength ──
  DOSAGE_STRENGTH_REGEX.lastIndex = 0;
  const strengthMatch = DOSAGE_STRENGTH_REGEX.exec(line);
  if (strengthMatch) {
    result.dosage_strength = `${strengthMatch[1]} ${strengthMatch[2].toLowerCase()}`;
    result._field_sources.dosage_strength = 'rule';
  } else {
    // Try tight match (no space)
    DOSAGE_STRENGTH_TIGHT.lastIndex = 0;
    const tightMatch = DOSAGE_STRENGTH_TIGHT.exec(line);
    if (tightMatch) {
      result.dosage_strength = `${tightMatch[1]} ${tightMatch[2].toLowerCase()}`;
      result._field_sources.dosage_strength = 'rule';
    }
  }

  // ── Frequency ──
  for (const fp of FREQUENCY_PATTERNS) {
    fp.regex.lastIndex = 0;
    const freqMatch = fp.regex.exec(line);
    if (freqMatch) {
      result.frequency = fp.normalize(freqMatch);
      result._field_sources.frequency = 'rule';
      break;
    }
  }

  // ── Duration ──
  for (const dp of DURATION_PATTERNS) {
    dp.regex.lastIndex = 0;
    const durMatch = dp.regex.exec(line);
    if (durMatch) {
      result.duration = dp.normalize(durMatch);
      result._field_sources.duration = 'rule';
      break;
    }
  }

  // ── Intake instruction ──
  for (const ip of INTAKE_PATTERNS) {
    ip.regex.lastIndex = 0;
    const intakeMatch = ip.regex.exec(line);
    if (intakeMatch) {
      result.intake_instruction = ip.normalize(intakeMatch);
      result._field_sources.intake_instruction = 'rule';
      break;
    }
  }

  // ── Drug name ──
  // Strategy 1: Dictionary match
  DRUG_REGEX.lastIndex = 0;
  const drugMatch = DRUG_REGEX.exec(line);
  if (drugMatch) {
    const normalized = DRUG_LOOKUP.get(drugMatch[1].toLowerCase());
    result.drug_name = normalized || drugMatch[1];
    result._field_sources.drug_name = 'dictionary';
  }

  // Strategy 2: Heuristic — if form token found, take next capitalized word(s)
  if (!result.drug_name && formMatch) {
    const afterForm = line.slice(formMatch.index + formMatch[0].length).trim();
    const candidateMatch = afterForm.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
    if (candidateMatch) {
      const candidate = candidateMatch[1].trim();
      const candidateLower = candidate.toLowerCase();
      if (!STOPWORDS.has(candidateLower) && candidate.length > 2) {
        result.drug_name = candidate;
        result._field_sources.drug_name = 'heuristic';
      }
    }
  }

  // Strategy 3: Find any capitalized word not in stopwords
  // ONLY if at least one clinical field (dosage, frequency, duration) is also present
  if (!result.drug_name) {
    const hasClinicalContext = !!(result.dosage_strength || result.frequency || result.duration || result.dosage_form);
    if (hasClinicalContext) {
      const words = line.split(/\s+/);
      for (const word of words) {
        const clean = word.replace(/[^a-zA-Z]/g, '');
        if (
          clean.length >= 4 &&
          /^[A-Z]/.test(clean) &&
          !STOPWORDS.has(clean.toLowerCase()) &&
          !HEADER_BLOCK_PATTERNS.some((p) => p.test(clean))
        ) {
          result.drug_name = clean;
          result._field_sources.drug_name = 'heuristic';
          break;
        }
      }
    }
  }

  // If no drug name found, this line isn't a medication line
  if (!result.drug_name) return null;

  return result;
}

// ═══════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════

/**
 * Compute confidence score for an extracted entity.
 * Each present field contributes to the score.
 *
 * @param {object} entity
 * @returns {{ score: number, missing_fields: string[] }}
 */
function computeConfidence(entity) {
  const fieldWeights = {
    drug_name: 0.30,
    dosage_strength: 0.25,
    frequency: 0.20,
    dosage_form: 0.10,
    duration: 0.10,
    intake_instruction: 0.05,
  };

  let score = 0;
  const missing = [];

  for (const [field, weight] of Object.entries(fieldWeights)) {
    if (entity[field]) {
      // Dictionary-matched drug names get full weight; heuristic gets 70%
      if (field === 'drug_name' && entity._field_sources?.drug_name === 'heuristic') {
        score += weight * 0.7;
      } else {
        score += weight;
      }
    } else {
      missing.push(field);
    }
  }

  return { score: Math.round(score * 100) / 100, missing_fields: missing };
}

// ═══════════════════════════════════════════════════════════
// MAIN RULE EXTRACTION
// ═══════════════════════════════════════════════════════════

/**
 * Run rule-based extraction on OCR text.
 *
 * @param {string} ocrText
 * @returns {{ entities: object[], lines: string[], stats: object }}
 */
function ruleExtract(ocrText) {
  const start = Date.now();

  if (!ocrText || !ocrText.trim()) {
    return { entities: [], lines: [], stats: { lineCount: 0, entityCount: 0, durationMs: 0 } };
  }

  const lines = groupIntoMedicationLines(ocrText);
  const entities = [];
  const seenDrugs = new Set();

  for (const line of lines) {
    const entity = extractFromLine(line);
    if (!entity) continue;

    const key = entity.drug_name.toLowerCase();
    if (seenDrugs.has(key)) continue;
    seenDrugs.add(key);

    const { score, missing_fields } = computeConfidence(entity);
    entity.rule_confidence = score;
    entity.missing_fields = missing_fields;

    entities.push(entity);
  }

  const durationMs = Date.now() - start;

  const stats = {
    lineCount: lines.length,
    entityCount: entities.length,
    fieldsDetected: entities.reduce((acc, e) => {
      for (const f of ['drug_name', 'dosage_strength', 'dosage_form', 'frequency', 'duration', 'intake_instruction']) {
        if (e[f]) acc[f] = (acc[f] || 0) + 1;
      }
      return acc;
    }, {}),
    missingFields: entities.reduce((acc, e) => {
      for (const f of e.missing_fields) acc[f] = (acc[f] || 0) + 1;
      return acc;
    }, {}),
    avgConfidence: entities.length > 0
      ? Math.round(entities.reduce((s, e) => s + e.rule_confidence, 0) / entities.length * 100) / 100
      : 0,
    durationMs,
  };

  log.info('Rule extraction complete', {
    entityCount: stats.entityCount,
    avgConfidence: stats.avgConfidence,
    fieldsDetected: stats.fieldsDetected,
    missingFields: stats.missingFields,
    durationMs,
  });

  return { entities, lines, stats };
}

module.exports = {
  ruleExtract,
  extractFromLine,
  groupIntoMedicationLines,
  computeConfidence,
  KNOWN_DRUGS,
  DRUG_LOOKUP,
};
