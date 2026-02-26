/**
 * Gemini Explainable AI Client
 * Version: gemini_reasoning_v1
 *
 * Responsible ONLY for semantic reasoning, explanation generation,
 * uncertainty detection, and intervention suggestion.
 *
 * This module is NEVER critical — pipeline continues on any failure.
 */

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const Prescription = require('../models/Prescription.model');
const { createLogger } = require('../utils/logger');

const log = createLogger('GeminiClient');

const GEMINI_VERSION = 'gemini_reasoning_v1';

// ── Safety settings — conservative for medical context ──
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ═══════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════

/**
 * System prompt — establishes role, reasoning style, output schema, and constraints.
 */
const SYSTEM_PROMPT = `You are a clinical reasoning assistant integrated into a prescription intelligence platform called ArogyaScript.

Your role is to provide concise, evidence-grounded explanations for AI-detected drug interactions, anomalies, and clinical concerns found in a patient prescription. You must never replace a licensed clinician.

## REASONING STYLE
- Conservative: flag uncertainty explicitly; do not assert what you cannot prove.
- Evidence-referenced: cite the mechanism, pharmacological class, or clinical evidence for each explanation.
- Human-readable: explanations must be understandable by a pharmacist or nurse, not just a physician.
- Never hallucinate interactions not present in the input data. If you are unsure, mark as uncertain.
- If a field in the input is missing or ambiguous, state that clearly in your output.

## OUTPUT CONTRACT
You MUST respond ONLY in valid JSON matching this exact schema — no markdown fences, no prose outside JSON:

{
  "explainability_summary": "<string: 2-4 sentences summarizing the overall prescription risk picture with provenance>",
  "ocr_uncertainty_flags": [
    {
      "text": "<low-confidence token text>",
      "confidence": <number 0-1>,
      "concern": "<string: what this ambiguity might affect>"
    }
  ],
  "entity_reconciliation": {
    "missing_fields": ["<field name>"],
    "ambiguous_entities": ["<entity text>"],
    "notes": "<string: observations about extraction completeness>"
  },
  "interaction_explanations": [
    {
      "drugA": "<string>",
      "drugB": "<string>",
      "severity": "<low|moderate|high|critical>",
      "mechanism": "<string: pharmacological mechanism>",
      "clinical_significance": "<string: patient impact>",
      "evidence_basis": "<string: e.g. CYP450 inhibition, RAAS dual blockade>",
      "uncertain": <boolean>
    }
  ],
  "anomaly_explanations": [
    {
      "signal_name": "<string>",
      "score": <number>,
      "clinical_meaning": "<string>",
      "suggested_cause": "<string>",
      "uncertain": <boolean>
    }
  ],
  "interventions": [
    {
      "priority": "<urgent|high|medium|low>",
      "action_type": "<consult_physician|verify_dosage|review_duplication|manual_review|monitor_lab|other>",
      "message": "<string: specific actionable instruction>",
      "related_drugs": ["<drug name>"],
      "evidence": "<string: reason for this intervention>"
    }
  ],
  "uncertainty_flags": [
    {
      "field": "<string: what is uncertain>",
      "reason": "<string: why it is uncertain>",
      "impact": "<string: clinical consequence if wrong>"
    }
  ],
  "gemini_status": "success",
  "reasoning_version": "gemini_reasoning_v1"
}

## CONSTRAINTS
- If you cannot explain an interaction confidently, set "uncertain": true and provide reasoning anyway.
- Do not invent drugs, interactions, or mechanisms not present in the input.
- If interactions array is empty, return empty array for interaction_explanations.
- All arrays may be empty [] — never null.
- gemini_status must always be "success" in your response.
`;

/**
 * Build the user-turn prompt from pipeline intermediate data.
 * @param {object} payload
 * @returns {string}
 */
function buildUserPrompt(payload) {
  const {
    jobId, ocr_text, ocr_tokens, entities, interactions,
    anomaly_signals, metadata,
  } = payload;

  return `Analyze the following prescription pipeline data for job ${jobId}.

## OCR TEXT
${ocr_text || '(no OCR text available)'}

## OCR TOKENS WITH CONFIDENCE
${JSON.stringify(ocr_tokens || [], null, 2)}

## STRUCTURED ENTITIES (drugs, dosage, frequency, duration)
${JSON.stringify(entities || [], null, 2)}

## DETECTED DRUG INTERACTIONS
${JSON.stringify(interactions || [], null, 2)}

## ANOMALY SIGNALS
${JSON.stringify(anomaly_signals || [], null, 2)}

## METADATA
- Timestamp: ${metadata?.timestamp || 'unknown'}
- User Role: ${metadata?.userRole || 'unknown'}

Respond ONLY in the JSON schema specified in your system instructions.`;
}

// ═══════════════════════════════════════════════════════════
// CORE GEMINI CALL WITH RETRY + TIMEOUT
// ═══════════════════════════════════════════════════════════

/**
 * Call Gemini with exponential backoff retry.
 * @param {object} model - Gemini model instance
 * @param {string} userPrompt
 * @param {number} maxRetries
 * @param {number} timeoutMs
 * @returns {string} raw model text
 */
async function callWithRetry(model, userPrompt, maxRetries, timeoutMs) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      log.info(`Gemini attempt ${attempt}/${maxRetries + 1}`);

      const result = await Promise.race([
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.1,          // Low temperature for consistent clinical reasoning
            topP: 0.8,
            maxOutputTokens: 2048,
          },
          safetySettings: SAFETY_SETTINGS,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const text = result.response.text();
      if (!text) throw new Error('Gemini returned empty response');
      return text;

    } catch (err) {
      lastError = err;
      const isRetryable =
        err.message?.includes('429') ||      // Rate limit
        err.message?.includes('503') ||      // Service unavailable
        err.message?.includes('timeout') ||
        err.message?.includes('RESOURCE_EXHAUSTED');

      if (!isRetryable || attempt > maxRetries) {
        log.warn(`Gemini call failed (attempt ${attempt})`, { error: err.message });
        break;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      log.info(`Gemini retry backoff ${backoffMs}ms`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════
// JSON RESPONSE PARSER
// ═══════════════════════════════════════════════════════════

/**
 * Strictly parse and validate Gemini JSON response.
 * Strips markdown fences if present, then parses.
 * @param {string} rawText
 * @returns {object} parsed reasoning object
 */
function parseGeminiResponse(rawText) {
  // Strip ```json ... ``` or ``` ... ``` fences if Gemini ignores instructions
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned);

  // Minimal structural validation
  const requiredArrays = [
    'ocr_uncertainty_flags', 'interaction_explanations',
    'anomaly_explanations', 'interventions', 'uncertainty_flags',
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(parsed[key])) {
      parsed[key] = [];
    }
  }

  if (!parsed.entity_reconciliation) {
    parsed.entity_reconciliation = { missing_fields: [], ambiguous_entities: [], notes: '' };
  }

  parsed.reasoning_version = GEMINI_VERSION;
  return parsed;
}

// ═══════════════════════════════════════════════════════════
// FALLBACK GENERATOR
// ═══════════════════════════════════════════════════════════

/**
 * Generate rule-based fallback when Gemini is unavailable.
 * Uses KB interaction descriptions and anomaly messages as explanation text.
 * @param {object} payload
 * @returns {object} fallback reasoning object
 */
function buildFallback(payload) {
  const { interactions = [], anomaly_signals = [], entities = [] } = payload;

  const interaction_explanations = interactions.map((intr) => ({
    drugA: intr.drugA || intr.drug1,
    drugB: intr.drugB || intr.drug2,
    severity: intr.severity || 'unknown',
    mechanism: intr.mechanism || intr.description || 'Mechanism not available (Gemini offline)',
    clinical_significance: intr.recommendation || 'Refer to clinical pharmacist',
    evidence_basis: 'Rule-based knowledge base',
    uncertain: true,
  }));

  const anomaly_explanations = anomaly_signals.map((sig) => ({
    signal_name: sig.name || sig.type,
    score: sig.score ?? 0,
    clinical_meaning: sig.explanation || sig.message || 'See anomaly flag for details',
    suggested_cause: 'Rule-based detection — AI explanation unavailable',
    uncertain: true,
  }));

  const interventions = [];

  const criticalInteractions = interactions.filter(
    (i) => i.severity === 'critical' || i.severity === 'high'
  );
  if (criticalInteractions.length > 0) {
    interventions.push({
      priority: 'urgent',
      action_type: 'consult_physician',
      message: `${criticalInteractions.length} high-severity drug interaction(s) detected. Immediate physician review required.`,
      related_drugs: criticalInteractions.flatMap((i) => [i.drugA || i.drug1, i.drugB || i.drug2].filter(Boolean)),
      evidence: 'KB-based interaction severity classification',
    });
  }

  if (entities.length >= 5) {
    interventions.push({
      priority: 'medium',
      action_type: 'consult_physician',
      message: `${entities.length} medications detected. Polypharmacy review recommended.`,
      related_drugs: entities.map((e) => e.drugName || e.text).filter(Boolean),
      evidence: 'Clinical guideline: polypharmacy threshold ≥5 medications',
    });
  }

  const drugNames = entities.map((e) => e.drugName || e.text).filter(Boolean);
  const summary = drugNames.length > 0
    ? `Prescription contains ${drugNames.length} medication(s): ${drugNames.join(', ')}. ${interactions.length} interaction(s) and ${anomaly_signals.length} anomaly signal(s) detected via rule-based analysis. AI explanation unavailable — fallback mode active.`
    : 'No medications could be extracted. Manual review required. AI explanation unavailable.';

  return {
    explainability_summary: summary,
    ocr_uncertainty_flags: [],
    entity_reconciliation: {
      missing_fields: [],
      ambiguous_entities: [],
      notes: 'Gemini offline — entity reconciliation not available',
    },
    interaction_explanations,
    anomaly_explanations,
    interventions,
    uncertainty_flags: [
      {
        field: 'all_gemini_outputs',
        reason: 'Gemini API unavailable — fallback rule-based explanations used',
        impact: 'Explanations are less context-aware; manual clinical review recommended',
      },
    ],
    gemini_status: 'failed',
    reasoning_version: GEMINI_VERSION,
  };
}

// ═══════════════════════════════════════════════════════════
// REQUEST BUILDER
// ═══════════════════════════════════════════════════════════

/**
 * Build normalized Gemini input payload from pipeline intermediate data.
 * @param {object} params
 * @returns {object} structured payload
 */
function buildGeminiPayload({ prescriptionId, ocrText, ocrTokens, entities, interactions, anomalyFlags, userId }) {
  // Normalize entity format
  const normalizedEntities = (entities || []).map((e) => ({
    type: 'medication',
    text: e.drugName || e.rawText || '',
    normalized: e.drugName || '',
    dosage: e.dosage || null,
    frequency: e.frequency || null,
    duration: e.duration || null,
    confidence: e.confidence || null,
  }));

  // Normalize interaction format
  const normalizedInteractions = (interactions || []).map((i) => ({
    drugA: i.drug1 || i.drugA || '',
    drugB: i.drug2 || i.drugB || '',
    severity: i.severity || 'unknown',
    mechanism: i.description || i.mechanism || '',
  }));

  // Normalize anomaly signals from flags
  const anomalySignals = (anomalyFlags || []).map((f) => ({
    name: f.type,
    score: f.severity === 'critical' ? 0.9 : f.severity === 'warning' ? 0.65 : 0.3,
    explanation: f.message || f.detail || '',
  }));

  // Build OCR token confidence list (synthetic from ocrText if no token breakdown)
  const ocrTokens_ = Array.isArray(ocrTokens) && ocrTokens.length > 0
    ? ocrTokens
    : (ocrText || '').split(/\s+/).slice(0, 50).map((tok) => ({ text: tok, confidence: 0.85 }));

  return {
    jobId: prescriptionId,
    ocr_text: ocrText || '',
    ocr_tokens: ocrTokens_,
    entities: normalizedEntities,
    interactions: normalizedInteractions,
    anomaly_signals: anomalySignals,
    metadata: {
      timestamp: new Date().toISOString(),
      userRole: 'healthcare_provider',
    },
  };
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORTED FUNCTION
// ═══════════════════════════════════════════════════════════

/**
 * Run Gemini reasoning and persist output to MongoDB.
 * NEVER throws — always returns a result (success or fallback).
 *
 * @param {object} params
 * @param {string} params.prescriptionId
 * @param {string} params.ocrText
 * @param {Array}  params.entities
 * @param {Array}  params.interactions
 * @param {Array}  params.anomalyFlags
 * @returns {object} Gemini reasoning result
 */
async function runGeminiReasoning({ prescriptionId, ocrText, entities, interactions, anomalyFlags }) {
  const start = Date.now();

  // Build payload
  const payload = buildGeminiPayload({ prescriptionId, ocrText, entities, interactions, anomalyFlags });

  // Pre-flight check — if no key configured, skip gracefully
  if (!process.env.GEMINI_API_KEY) {
    log.warn('GEMINI_API_KEY not set — skipping Gemini step', { prescriptionId });
    const fallback = buildFallback(payload);
    fallback.gemini_status = 'skipped';
    await persistGeminiResult(prescriptionId, fallback, Date.now() - start);
    return fallback;
  }

  const maxRetries = parseInt(process.env.GEMINI_MAX_RETRIES || '2', 10);
  const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '15000', 10);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

  let reasoning;
  let geminiError = null;

  try {
    // Initialize client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_PROMPT,
    });

    const userPrompt = buildUserPrompt(payload);
    log.info('Calling Gemini', { prescriptionId, model: modelName, entityCount: payload.entities.length });

    const rawText = await callWithRetry(model, userPrompt, maxRetries, timeoutMs);
    reasoning = parseGeminiResponse(rawText);
    reasoning.gemini_status = 'success';

    log.info('Gemini reasoning complete', {
      prescriptionId,
      durationMs: Date.now() - start,
      interventionCount: reasoning.interventions?.length,
      uncertaintyFlagCount: reasoning.uncertainty_flags?.length,
    });

  } catch (err) {
    geminiError = err.message;
    log.error('Gemini reasoning failed — using fallback', { prescriptionId, error: err.message });
    reasoning = buildFallback(payload);
  }

  await persistGeminiResult(prescriptionId, reasoning, Date.now() - start, geminiError);
  return reasoning;
}

// ═══════════════════════════════════════════════════════════
// MONGO PERSISTENCE
// ═══════════════════════════════════════════════════════════

/**
 * Persist Gemini output to the prescription document.
 */
async function persistGeminiResult(prescriptionId, reasoning, durationMs, errorMsg) {
  try {
    await Prescription.findOneAndUpdate(
      { prescriptionId },
      {
        $set: {
          geminiReasoning: {
            explainability_summary: reasoning.explainability_summary || '',
            interaction_explanations: reasoning.interaction_explanations || [],
            anomaly_explanations: reasoning.anomaly_explanations || [],
            interventions: reasoning.interventions || [],
            uncertainty_flags: reasoning.uncertainty_flags || [],
            ocr_uncertainty_flags: reasoning.ocr_uncertainty_flags || [],
            entity_reconciliation: reasoning.entity_reconciliation || {},
            gemini_status: reasoning.gemini_status,
            reasoning_version: GEMINI_VERSION,
            durationMs,
            error: errorMsg || null,
            generatedAt: new Date(),
          },
          'pipelineStatus.gemini': {
            status: reasoning.gemini_status === 'success' ? 'success' : 'failed',
            error: errorMsg || null,
            durationMs,
          },
        },
      },
      { new: true }
    );
    log.info('Gemini result persisted', { prescriptionId, status: reasoning.gemini_status });
  } catch (err) {
    log.error('Failed to persist Gemini result', { prescriptionId, error: err.message });
  }
}

module.exports = { runGeminiReasoning, buildGeminiPayload, buildFallback, GEMINI_VERSION };
