/**
 * Groq LLM Fallback Extractor
 * Called when the rule-based extractor misses ≥2 critical fields
 * or average confidence falls below threshold.
 *
 * Uses the existing Groq/OpenAI-compatible client to parse noisy OCR text
 * into structured medication entities.
 */

const OpenAI = require('openai');
const { createLogger } = require('../../utils/logger');

const log = createLogger('LLMExtractor');

// ═══════════════════════════════════════════════════════════
// PROMPT TEMPLATES
// ═══════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a clinical prescription parser that converts noisy handwritten OCR text into structured medication entities.

You receive raw OCR text from a prescription image and optionally a partial extraction from a rule-based system. Your job is to fill in missing or incorrect fields.

## CRITICAL: WHAT TO EXTRACT vs IGNORE
EXTRACT ONLY actual prescribed medications (drugs, medicines, supplements).

DO NOT EXTRACT any of the following — they are NOT medications:
- Hospital/clinic names (e.g. "Sunrise Multispeciality Hospital", "Apollo Clinic")
- Doctor names (e.g. "Dr. Rohan Sharma", "Dr. Amit Kumar")
- Patient names, age, sex, gender, address, phone numbers
- City names (e.g. "Mumbai", "Delhi", "Pune")
- Medical qualifications (e.g. "MBBS", "MD", "FRCS", "DNB")
- OPD/IPD numbers, registration numbers, dates
- Diagnosis text, chief complaints, history, examination findings
- Any header/footer/watermark text from the prescription form

## OUTPUT CONTRACT
Respond ONLY in valid JSON matching this exact schema — no markdown fences, no prose:

{
  "medications": [
    {
      "drug_name": "<string: normalized drug name>",
      "dosage_strength": "<string: e.g. '500 mg', '5 ml' or null>",
      "dosage_form": "<string: Tablet|Capsule|Syrup|Injection|Drops|Ointment|Cream|Inhaler or null>",
      "frequency": "<string: e.g. '1-0-1', 'twice daily', 'OD' or null>",
      "duration": "<string: e.g. '5 days', '1 week' or null>",
      "intake_instruction": "<string: e.g. 'after food', 'before breakfast' or null>"
    }
  ]
}

## RULES
- Extract ONLY medications actually present in the OCR text. Do NOT invent drugs.
- If a word looks like a hospital name, person name, city, or non-drug term, skip it entirely.
- If a field cannot be determined, use null.
- Normalize drug names to standard spellings (e.g. "Parcetamol" → "Paracetamol").
- Normalize frequency codes: "1-0-1" means morning-afternoon-night dosing.
- Normalize common OCR errors: "Amoxicilin" → "Amoxicillin", "Pantoprczole" → "Pantoprazole".
- Keep output concise. Maximum 10 medications.
- If the OCR text contains no actual medications, return {"medications": []}.
- Respond ONLY with the JSON object.`;

/**
 * Build user prompt with OCR text and partial rule extraction.
 * @param {string} ocrText
 * @param {object[]} ruleEntities - partial results from rule extraction
 * @returns {string}
 */
function buildExtractionPrompt(ocrText, ruleEntities) {
  let prompt = `Parse the following prescription OCR text into structured medication entities.

## RAW OCR TEXT
${ocrText}
`;

  if (ruleEntities && ruleEntities.length > 0) {
    prompt += `
## PARTIAL RULE-BASED EXTRACTION (may have missing/incorrect fields)
${JSON.stringify(ruleEntities.map((e) => ({
  drug_name: e.drug_name,
  dosage_strength: e.dosage_strength,
  dosage_form: e.dosage_form,
  frequency: e.frequency,
  duration: e.duration,
  intake_instruction: e.intake_instruction,
  missing_fields: e.missing_fields,
})), null, 2)}

Fill in the missing fields and correct any errors. If the rule extraction missed a medication, add it.
`;
  }

  prompt += '\nRespond ONLY in the JSON schema specified in your system instructions.';
  return prompt;
}

// ═══════════════════════════════════════════════════════════
// RESPONSE VALIDATION
// ═══════════════════════════════════════════════════════════

/**
 * Parse and validate the LLM response.
 * @param {string} rawText
 * @returns {{ valid: boolean, data: object[]|null, error: string|null }}
 */
function validateExtractionResponse(rawText) {
  try {
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Accept both { medications: [...] } and bare [...]
    let medications;
    if (Array.isArray(parsed)) {
      medications = parsed;
    } else if (parsed.medications && Array.isArray(parsed.medications)) {
      medications = parsed.medications;
    } else {
      return { valid: false, data: null, error: 'Response missing "medications" array' };
    }

    // Validate each medication has at least drug_name
    const validMeds = [];
    for (const med of medications) {
      if (!med.drug_name || typeof med.drug_name !== 'string') continue;
      validMeds.push({
        drug_name: med.drug_name.trim(),
        dosage_strength: typeof med.dosage_strength === 'string' ? med.dosage_strength.trim() : null,
        dosage_form: typeof med.dosage_form === 'string' ? med.dosage_form.trim() : null,
        frequency: typeof med.frequency === 'string' ? med.frequency.trim() : null,
        duration: typeof med.duration === 'string' ? med.duration.trim() : null,
        intake_instruction: typeof med.intake_instruction === 'string' ? med.intake_instruction.trim() : null,
      });
    }

    if (validMeds.length === 0) {
      return { valid: false, data: null, error: 'No valid medications in response' };
    }

    return { valid: true, data: validMeds, error: null };
  } catch (err) {
    return { valid: false, data: null, error: `JSON parse error: ${err.message}` };
  }
}

// ═══════════════════════════════════════════════════════════
// GROQ API CALL
// ═══════════════════════════════════════════════════════════

/**
 * Call Groq for LLM-assisted entity extraction.
 *
 * @param {object} options
 * @param {string} options.ocrText
 * @param {object[]} options.ruleEntities - partial rule results
 * @param {number} [options.maxRetries=1]
 * @param {number} [options.timeoutMs=12000]
 * @returns {Promise<{ success: boolean, data: object[]|null, error: string|null, latencyMs: number }>}
 */
async function callLLMExtractor({ ocrText, ruleEntities, maxRetries = 1, timeoutMs = 12000 }) {
  const start = Date.now();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    log.warn('GROQ_API_KEY not set — LLM extractor unavailable');
    return { success: false, data: null, error: 'GROQ_API_KEY not configured', latencyMs: Date.now() - start };
  }

  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

  const client = new OpenAI({ apiKey, baseURL });
  const userPrompt = buildExtractionPrompt(ocrText, ruleEntities);
  let lastError;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      log.info(`LLM extraction attempt ${attempt}/${maxRetries + 1}`, { model });

      const completion = await Promise.race([
        client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.05,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`LLM extractor timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const rawText = completion.choices?.[0]?.message?.content;
      if (!rawText) throw new Error('LLM returned empty response');

      const validation = validateExtractionResponse(rawText);
      if (!validation.valid) {
        log.warn('LLM extraction JSON validation failed', { error: validation.error });
        throw new Error(`JSON validation failed: ${validation.error}`);
      }

      const latencyMs = Date.now() - start;
      log.info('LLM extraction complete', {
        model,
        latencyMs,
        medicationCount: validation.data.length,
      });

      return { success: true, data: validation.data, error: null, latencyMs };

    } catch (err) {
      lastError = err;
      const isRetryable =
        err.message?.includes('429') ||
        err.message?.includes('503') ||
        err.message?.includes('timeout') ||
        err.status === 429 ||
        err.status === 503;

      if (!isRetryable || attempt > maxRetries) {
        log.warn(`LLM extraction failed (attempt ${attempt})`, { error: err.message });
        break;
      }

      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      log.info(`LLM extraction retry backoff ${backoffMs}ms`);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  return {
    success: false,
    data: null,
    error: lastError?.message || 'LLM extraction failed',
    latencyMs: Date.now() - start,
  };
}

module.exports = {
  callLLMExtractor,
  buildExtractionPrompt,
  validateExtractionResponse,
};
