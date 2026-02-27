/**
 * Structuring Service — Enhanced
 * Orchestrates prescription entity extraction with two-stage pipeline:
 *   1. Rule-based regex extraction (fast, deterministic)
 *   2. LLM-assisted fallback via Groq (when rules miss critical fields)
 *
 * Merge strategy: rule results are authoritative; LLM fills only missing fields.
 */

const { ruleExtract, KNOWN_DRUGS, DRUG_LOOKUP } = require('./extraction/ruleExtractor');
const { callLLMExtractor } = require('./extraction/llmExtractor');
const { createLogger } = require('../utils/logger');

const log = createLogger('Structuring');

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

/** Critical fields — if ≥ MISSING_THRESHOLD are absent, trigger LLM */
const CRITICAL_FIELDS = ['drug_name', 'dosage_strength', 'frequency'];
const MISSING_THRESHOLD = 2;

/** Minimum average confidence to skip LLM */
const CONFIDENCE_THRESHOLD = 0.55;

/** Minimum entity confidence to include in final results.
 *  Entities below this threshold are discarded (e.g. header text mis-parsed as drugs). */
const MIN_ENTITY_CONFIDENCE = parseFloat(process.env.MIN_ENTITY_CONFIDENCE || '0.35');

// ═══════════════════════════════════════════════════════════
// MERGE STRATEGY
// ═══════════════════════════════════════════════════════════

/**
 * Merge LLM entities into rule entities.
 * Rule extraction is authoritative — LLM fills ONLY missing fields.
 * If LLM found drugs that rules missed entirely, they are appended.
 *
 * @param {object[]} ruleEntities
 * @param {object[]} llmEntities
 * @returns {{ merged: object[], mergeOps: object[] }}
 */
function mergeEntities(ruleEntities, llmEntities) {
  const mergeOps = [];
  const merged = [...ruleEntities];
  const ruleKeys = new Set(ruleEntities.map((e) => e.drug_name.toLowerCase()));

  const MERGEABLE_FIELDS = ['dosage_strength', 'dosage_form', 'frequency', 'duration', 'intake_instruction'];

  for (const llmEntity of llmEntities) {
    const llmKey = llmEntity.drug_name.toLowerCase();
    const ruleIdx = merged.findIndex((e) => e.drug_name.toLowerCase() === llmKey);

    if (ruleIdx >= 0) {
      // Existing drug — fill missing fields only
      const ruleEntity = merged[ruleIdx];
      for (const field of MERGEABLE_FIELDS) {
        if (!ruleEntity[field] && llmEntity[field]) {
          ruleEntity[field] = llmEntity[field];
          ruleEntity._field_sources = ruleEntity._field_sources || {};
          ruleEntity._field_sources[field] = 'llm';
          // Remove from missing_fields
          if (ruleEntity.missing_fields) {
            ruleEntity.missing_fields = ruleEntity.missing_fields.filter((f) => f !== field);
          }
          mergeOps.push({ drug: ruleEntity.drug_name, field, source: 'llm', value: llmEntity[field] });
        }
      }
      // Recalculate confidence after merge
      ruleEntity.rule_confidence = recalcConfidence(ruleEntity);
    } else if (!ruleKeys.has(llmKey)) {
      // New drug found by LLM — append with lower confidence
      ruleKeys.add(llmKey);
      const newEntity = {
        drug_name: llmEntity.drug_name,
        dosage_strength: llmEntity.dosage_strength,
        dosage_form: llmEntity.dosage_form,
        frequency: llmEntity.frequency,
        duration: llmEntity.duration,
        intake_instruction: llmEntity.intake_instruction,
        _raw_line: '',
        _field_sources: { drug_name: 'llm' },
        rule_confidence: 0,
        missing_fields: [],
      };
      for (const field of MERGEABLE_FIELDS) {
        if (llmEntity[field]) {
          newEntity._field_sources[field] = 'llm';
        } else {
          newEntity.missing_fields.push(field);
        }
      }
      newEntity.rule_confidence = recalcConfidence(newEntity);
      merged.push(newEntity);
      mergeOps.push({ drug: llmEntity.drug_name, field: 'new_entity', source: 'llm' });
    }
  }

  return { merged, mergeOps };
}

/**
 * Recalculate confidence after merge.
 */
function recalcConfidence(entity) {
  const weights = {
    drug_name: 0.30, dosage_strength: 0.25, frequency: 0.20,
    dosage_form: 0.10, duration: 0.10, intake_instruction: 0.05,
  };
  let score = 0;
  for (const [field, weight] of Object.entries(weights)) {
    if (entity[field]) {
      // Dictionary/rule sources get full weight, LLM/heuristic get 80%
      const src = entity._field_sources?.[field];
      score += (src === 'dictionary' || src === 'rule') ? weight : weight * 0.8;
    }
  }
  return Math.round(score * 100) / 100;
}

// ═══════════════════════════════════════════════════════════
// TRANSFORM TO LEGACY ENTITY FORMAT
// ═══════════════════════════════════════════════════════════

/**
 * Transform enhanced entity to legacy schema expected by Prescription model.
 * @param {object} entity
 * @returns {object} legacy entity
 */
function toLegacyEntity(entity) {
  // Build dosage string: combine form + strength
  let dosage = entity.dosage_strength || '';
  if (entity.dosage_form && entity.dosage_strength) {
    dosage = `${entity.dosage_form} ${entity.dosage_strength}`;
  } else if (entity.dosage_form) {
    dosage = entity.dosage_form;
  }

  // Build frequency string: combine frequency + intake
  let frequency = entity.frequency || '';
  if (entity.intake_instruction && frequency) {
    frequency = `${frequency} ${entity.intake_instruction}`;
  } else if (entity.intake_instruction) {
    frequency = entity.intake_instruction;
  }

  return {
    drugName: entity.drug_name,
    rawText: entity._raw_line || entity.drug_name,
    dosage: dosage || null,
    frequency: frequency || null,
    duration: entity.duration || null,
    confidence: entity.rule_confidence || 0.5,
  };
}

// ═══════════════════════════════════════════════════════════
// EVALUATE COMPLETENESS
// ═══════════════════════════════════════════════════════════

/**
 * Determine if LLM fallback should be triggered.
 * @param {object[]} entities
 * @param {object} stats
 * @returns {{ needsLLM: boolean, reason: string }}
 */
function evaluateCompleteness(entities, stats) {
  if (entities.length === 0) {
    return { needsLLM: true, reason: 'no_entities_extracted' };
  }

  // Check if any entity is missing ≥ MISSING_THRESHOLD critical fields
  const entitiesWithMajorGaps = entities.filter((e) => {
    const missingCritical = CRITICAL_FIELDS.filter((f) => !e[f]);
    return missingCritical.length >= MISSING_THRESHOLD;
  });

  if (entitiesWithMajorGaps.length > 0) {
    return {
      needsLLM: true,
      reason: `${entitiesWithMajorGaps.length}/${entities.length} entities missing ≥${MISSING_THRESHOLD} critical fields`,
    };
  }

  // Check average confidence
  if (stats.avgConfidence < CONFIDENCE_THRESHOLD) {
    return { needsLLM: true, reason: `avg_confidence ${stats.avgConfidence} < ${CONFIDENCE_THRESHOLD}` };
  }

  return { needsLLM: false, reason: 'rule_extraction_sufficient' };
}

// ═══════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════

/**
 * Extract structured entities from raw OCR text.
 * Two-stage pipeline: rule extraction → optional LLM fallback → merge.
 *
 * @param {string} ocrText
 * @returns {Promise<{ status: string, entities: Array, rawLineCount: number, durationMs: number, extractionMode: string, error?: string }>}
 */
async function structureText(ocrText) {
  const start = Date.now();

  try {
    if (!ocrText || ocrText.trim().length === 0) {
      log.warn('Empty OCR text received');
      return { status: 'success', entities: [], rawLineCount: 0, durationMs: Date.now() - start, extractionMode: 'none' };
    }

    // ── Stage 1: Rule-based extraction ──
    const { entities: ruleEntities, lines, stats } = ruleExtract(ocrText);

    log.info('Rule extraction stage complete', {
      entityCount: ruleEntities.length,
      avgConfidence: stats.avgConfidence,
      fieldsDetected: stats.fieldsDetected,
      missingFields: stats.missingFields,
    });

    let finalEntities = ruleEntities;
    let extractionMode = 'rule';

    // ── Stage 2: Evaluate completeness & maybe trigger LLM ──
    const llmEnabled = process.env.LLM_EXTRACTION_ENABLED !== 'false' && process.env.GROQ_API_KEY;
    const { needsLLM, reason } = evaluateCompleteness(ruleEntities, stats);

    if (needsLLM && llmEnabled) {
      log.info('LLM fallback triggered', { reason, entityCount: ruleEntities.length });

      const llmResult = await callLLMExtractor({
        ocrText,
        ruleEntities,
        maxRetries: parseInt(process.env.LLM_EXTRACTION_MAX_RETRIES || '1', 10),
        timeoutMs: parseInt(process.env.LLM_EXTRACTION_TIMEOUT_MS || '12000', 10),
      });

      if (llmResult.success && llmResult.data) {
        const { merged, mergeOps } = mergeEntities(ruleEntities, llmResult.data);
        finalEntities = merged;
        extractionMode = 'rule+llm';

        log.info('LLM merge complete', {
          ruleCount: ruleEntities.length,
          llmCount: llmResult.data.length,
          mergedCount: merged.length,
          mergeOps,
          llmLatencyMs: llmResult.latencyMs,
        });
      } else {
        log.warn('LLM extraction failed, using rule-only results', {
          error: llmResult.error,
          latencyMs: llmResult.latencyMs,
        });
        extractionMode = 'rule (llm_failed)';
      }
    } else if (needsLLM && !llmEnabled) {
      log.info('LLM fallback needed but disabled/unconfigured', { reason });
      extractionMode = 'rule (llm_disabled)';
    }

    // ── Filter out low-confidence entities (header noise, etc.) ──
    const filteredEntities = finalEntities.filter((e) => {
      if (e.rule_confidence < MIN_ENTITY_CONFIDENCE) {
        log.info('Discarding low-confidence entity', {
          drug: e.drug_name,
          confidence: e.rule_confidence,
          threshold: MIN_ENTITY_CONFIDENCE,
          source: e._field_sources?.drug_name,
        });
        return false;
      }
      return true;
    });

    // ── Transform to legacy format ──
    const legacyEntities = filteredEntities.map(toLegacyEntity);

    log.info('Structuring completed', {
      entityCount: legacyEntities.length,
      discarded: finalEntities.length - filteredEntities.length,
      lineCount: lines.length,
      extractionMode,
      durationMs: Date.now() - start,
    });

    return {
      status: 'success',
      entities: legacyEntities,
      rawLineCount: lines.length,
      durationMs: Date.now() - start,
      extractionMode,
    };
  } catch (err) {
    log.error('Structuring failed', { error: err.message });
    return {
      status: 'failed',
      entities: [],
      rawLineCount: 0,
      error: err.message,
      durationMs: Date.now() - start,
      extractionMode: 'failed',
    };
  }
}

module.exports = { structureText, mergeEntities, evaluateCompleteness, KNOWN_DRUGS, DRUG_LOOKUP };
