/**
 * Groq Reasoning Provider
 * Uses Groq API (OpenAI-compatible) with Llama3-8B to generate
 * explainable clinical reasoning from prescription pipeline data.
 *
 * Replaces the previous Gemini-based reasoning module.
 * This module is NEVER critical — pipeline continues on any failure.
 */

const OpenAI = require('openai');
const { createLogger } = require('../../utils/logger');

const log = createLogger('GroqProvider');

const REASONING_VERSION = 'groq_reasoning_v1';

// ═══════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a clinical decision-support reasoning engine that generates concise, explainable prescription safety insights.

You are integrated into a prescription intelligence platform called ArogyaScript. Your role is to analyze structured prescription data and produce clear, evidence-grounded explanations for drug interactions, anomalies, and clinical concerns.

## REASONING STYLE
- Conservative: flag uncertainty explicitly; do not assert what you cannot prove.
- Evidence-referenced: cite the mechanism, pharmacological class, or clinical evidence for each explanation.
- Human-readable: explanations must be understandable by a pharmacist or nurse, not just a physician.
- Never hallucinate interactions not present in the input data.
- If a field in the input is missing or ambiguous, state that clearly.

## OUTPUT CONTRACT
You MUST respond ONLY in valid JSON matching this exact schema — no markdown fences, no prose outside JSON:

{
  "summary": "<string: 2-4 sentences summarizing overall prescription risk>",
  "interaction_explanations": [
    {
      "pair": "<string: DrugA + DrugB>",
      "severity": "<low|moderate|high|critical>",
      "reason": "<string: pharmacological mechanism and clinical significance>"
    }
  ],
  "anomaly_explanations": [
    {
      "type": "<string: anomaly type>",
      "reason": "<string: clinical meaning and suggested cause>"
    }
  ],
  "interventions": [
    {
      "action": "<string: specific actionable instruction>",
      "rationale": "<string: reason for this intervention>"
    }
  ]
}

## CONSTRAINTS
- Do not invent drugs, interactions, or mechanisms not present in the input.
- If interactions array is empty, return empty array for interaction_explanations.
- All arrays may be empty [] — never null.
- Respond ONLY with the JSON object. No additional text.`;

/**
 * Build the user-turn prompt from pipeline intermediate data.
 * Serializes all structured input for the LLM.
 * @param {object} payload
 * @returns {string}
 */
function buildUserPrompt(payload) {
  const {
    extracted_drugs,
    dosage_information,
    drug_interactions,
    anomaly_signals,
    rule_engine_outputs,
  } = payload;

  return `Analyze the following prescription pipeline data and generate explainable reasoning.

## EXTRACTED DRUGS
${JSON.stringify(extracted_drugs || [], null, 2)}

## DOSAGE INFORMATION
${JSON.stringify(dosage_information || [], null, 2)}

## DRUG INTERACTIONS
${JSON.stringify(drug_interactions || [], null, 2)}

## ANOMALY SIGNALS
${JSON.stringify(anomaly_signals || [], null, 2)}

## RULE ENGINE OUTPUTS
${JSON.stringify(rule_engine_outputs || [], null, 2)}

Respond ONLY in the JSON schema specified in your system instructions.`;
}

// ═══════════════════════════════════════════════════════════
// JSON RESPONSE VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Parse and validate the Groq JSON response against the expected schema.
 * Strips markdown fences if present, then parses and validates structure.
 * @param {string} rawText
 * @returns {{ valid: boolean, data: object|null, error: string|null }}
 */
function validateJsonResponse(rawText) {
  try {
    // Strip markdown fences if the model ignores instructions
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate required top-level fields
    if (typeof parsed.summary !== 'string') {
      return { valid: false, data: null, error: 'Missing or invalid "summary" field' };
    }

    // Ensure arrays exist and are arrays
    const arrayFields = ['interaction_explanations', 'anomaly_explanations', 'interventions'];
    for (const field of arrayFields) {
      if (!Array.isArray(parsed[field])) {
        parsed[field] = [];
      }
    }

    // Validate interaction_explanations items
    for (const item of parsed.interaction_explanations) {
      if (typeof item.pair !== 'string' || typeof item.severity !== 'string' || typeof item.reason !== 'string') {
        return { valid: false, data: null, error: `Invalid interaction_explanation item: ${JSON.stringify(item)}` };
      }
    }

    // Validate anomaly_explanations items
    for (const item of parsed.anomaly_explanations) {
      if (typeof item.type !== 'string' || typeof item.reason !== 'string') {
        return { valid: false, data: null, error: `Invalid anomaly_explanation item: ${JSON.stringify(item)}` };
      }
    }

    // Validate interventions items
    for (const item of parsed.interventions) {
      if (typeof item.action !== 'string' || typeof item.rationale !== 'string') {
        return { valid: false, data: null, error: `Invalid intervention item: ${JSON.stringify(item)}` };
      }
    }

    return { valid: true, data: parsed, error: null };
  } catch (err) {
    return { valid: false, data: null, error: `JSON parse error: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════
// PAYLOAD BUILDER
// ═══════════════════════════════════════════════════════════

/**
 * Build normalized Groq input payload from pipeline intermediate data.
 * Transforms raw pipeline entities/interactions/flags into the structured
 * format expected by the prompt.
 *
 * @param {object} params
 * @returns {object} structured payload for prompt builder
 */
function buildReasoningPayload({ prescriptionId, ocrText, entities, interactions, anomalyFlags, interventions }) {
  // Extracted drugs with dosage info
  const extracted_drugs = (entities || []).map((e) => ({
    name: e.drugName || e.rawText || '',
    confidence: e.confidence || null,
  }));

  const dosage_information = (entities || []).map((e) => ({
    drug: e.drugName || '',
    dosage: e.dosage || null,
    frequency: e.frequency || null,
    duration: e.duration || null,
  }));

  // Normalize interactions
  const drug_interactions = (interactions || []).map((i) => ({
    drugA: i.drug1 || i.drugA || '',
    drugB: i.drug2 || i.drugB || '',
    severity: i.severity || 'unknown',
    description: i.description || i.mechanism || '',
    recommendation: i.recommendation || '',
  }));

  // Normalize anomaly signals
  const anomaly_signals = (anomalyFlags || []).map((f) => ({
    type: f.type,
    severity: f.severity || 'warning',
    message: f.message || f.detail || '',
    drugName: f.drugName || null,
  }));

  // Rule engine outputs (interventions from rule engine)
  const rule_engine_outputs = (interventions || []).map((iv) => ({
    type: iv.type || iv.action_type || '',
    priority: iv.priority || 'medium',
    message: iv.message || '',
    relatedDrugs: iv.relatedDrugs || iv.related_drugs || [],
  }));

  return {
    prescriptionId,
    extracted_drugs,
    dosage_information,
    drug_interactions,
    anomaly_signals,
    rule_engine_outputs,
  };
}

// ═══════════════════════════════════════════════════════════
// GROQ API CALL
// ═══════════════════════════════════════════════════════════

/**
 * Call Groq chat completion API with retry logic.
 *
 * @param {object} options
 * @param {object} options.payload - structured reasoning payload
 * @param {number} [options.maxRetries=2]
 * @param {number} [options.timeoutMs=15000]
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null, latencyMs: number }>}
 */
async function callGroq({ payload, maxRetries = 2, timeoutMs = 15000 }) {
  const start = Date.now();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    log.warn('GROQ_API_KEY not set — Groq provider unavailable');
    return { success: false, data: null, error: 'GROQ_API_KEY not configured', latencyMs: Date.now() - start };
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  const userPrompt = buildUserPrompt(payload);
  let lastError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      log.info(`Groq attempt ${attempt}/${maxRetries + 1}`, { model, prescriptionId: payload.prescriptionId });

      const completion = await Promise.race([
        client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 800,
          response_format: { type: 'json_object' },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Groq timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const rawText = completion.choices?.[0]?.message?.content;
      if (!rawText) {
        throw new Error('Groq returned empty response');
      }

      // Validate JSON structure
      const validation = validateJsonResponse(rawText);
      if (!validation.valid) {
        log.warn('Groq JSON validation failed', {
          error: validation.error,
          prescriptionId: payload.prescriptionId,
        });
        throw new Error(`JSON validation failed: ${validation.error}`);
      }

      const latencyMs = Date.now() - start;
      log.info('Groq reasoning complete', {
        prescriptionId: payload.prescriptionId,
        model,
        latencyMs,
        interactionCount: validation.data.interaction_explanations.length,
        anomalyCount: validation.data.anomaly_explanations.length,
        interventionCount: validation.data.interventions.length,
      });

      return { success: true, data: validation.data, error: null, latencyMs };

    } catch (err) {
      lastError = err;
      const isRetryable =
        err.message?.includes('429') ||
        err.message?.includes('503') ||
        err.message?.includes('timeout') ||
        err.message?.includes('rate_limit') ||
        err.status === 429 ||
        err.status === 503;

      if (!isRetryable || attempt > maxRetries) {
        log.warn(`Groq call failed (attempt ${attempt})`, {
          error: err.message,
          prescriptionId: payload.prescriptionId,
        });
        break;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      log.info(`Groq retry backoff ${backoffMs}ms`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  return {
    success: false,
    data: null,
    error: lastError?.message || 'Groq call failed',
    latencyMs: Date.now() - start,
  };
}

module.exports = {
  callGroq,
  buildReasoningPayload,
  buildUserPrompt,
  validateJsonResponse,
  REASONING_VERSION,
  SYSTEM_PROMPT,
};
