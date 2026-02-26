const Entity = require('./model');
const DrugSynonym = require('../drugNormalization/model');
const analyticsService = require('../analytics/service');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

// ─── Regex Patterns ────────────────────────────────────────────────────────────
const DOSAGE_REGEX = /(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|iu|units?)/gi;
const FREQUENCY_REGEX = /\b(once|twice|thrice|(\d+)\s*x)\s*(daily|a\s*day|per\s*day|at\s*night|in\s*morning|at\s*noon|od|bd|tds|qid|prn|sos)\b/gi;
const DURATION_REGEX = /\b(\d+)\s*(days?|weeks?|months?)\b/gi;
const DOCTOR_REGEX = /dr\.?\s+([a-z][a-z\s\.]+)/gi;
const PATIENT_REGEX = /patient\s*[:\-]?\s*([a-z][a-z\s]+)/gi;

const extractMatch = (text, regex) => {
  const matches = [];
  let m;
  regex.lastIndex = 0;
  while ((m = regex.exec(text)) !== null) matches.push(m[0]);
  return matches;
};

/**
 * Entity Extraction Service:
 * 1. Parse raw OCR text with regex
 * 2. Normalize drug names via synonym lookup
 * 3. Store in entities collection
 * 4. Emit ENTITY_EXTRACTION_COMPLETED
 */
const extractAndStoreEntities = async (prescription, ocrOutput) => {
  try {
    const text = ocrOutput.rawText || '';
    logger.info(`[Entities] Extracting from prescription: ${prescription._id}`);

    // Extract metadata
    const doctorMatches = extractMatch(text, DOCTOR_REGEX);
    const patientMatches = extractMatch(text, PATIENT_REGEX);

    // Split text into lines and find drug candidates
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const drugs = [];

    for (const line of lines) {
      // Find strength
      const strengthMatches = extractMatch(line, DOSAGE_REGEX);
      const frequencyMatches = extractMatch(line, FREQUENCY_REGEX);
      const durationMatches = extractMatch(line, DURATION_REGEX);

      if (strengthMatches.length > 0) {
        // Try to find a drug name (word before or on the line)
        const rawName = line.split(strengthMatches[0])[0].trim().split(/\s+/).slice(-2).join(' ');
        if (!rawName) continue;

        // Normalize via synonym lookup
        const synonym = await DrugSynonym.findOne({
          $or: [
            { genericName: { $regex: new RegExp(rawName, 'i') } },
            { brandNames: { $regex: new RegExp(rawName, 'i') } },
            { synonyms: { $regex: new RegExp(rawName, 'i') } },
          ],
        });

        const token = ocrOutput.tokens.find((t) => line.includes(t.text));

        drugs.push({
          rawName,
          normalizedName: synonym?.genericName || rawName,
          strength: strengthMatches[0] || null,
          frequency: frequencyMatches[0] || null,
          duration: durationMatches[0] || null,
          confidence: token?.confidence ?? 0.5,
        });
      }
    }

    const entityDoc = await Entity.findOneAndUpdate(
      { prescriptionId: prescription._id },
      {
        prescriptionId: prescription._id,
        drugs,
        doctorName: doctorMatches[0] || null,
        patientName: patientMatches[0] || null,
      },
      { upsert: true, new: true }
    );

    await analyticsService.logEvent('ENTITY_EXTRACTION_COMPLETED', prescription._id, {
      drugCount: drugs.length,
      hasDoctorName: !!entityDoc.doctorName,
      hasPatientName: !!entityDoc.patientName,
    });

    eventBus.emit(EVENTS.ENTITY_EXTRACTION_COMPLETED, { prescription, entityDoc });
    logger.info(`[Entities] Extracted ${drugs.length} drugs for prescription: ${prescription._id}`);
    return entityDoc;
  } catch (err) {
    logger.error(`[Entities] Extraction failed for ${prescription._id}: ${err.message}`);
    throw err;
  }
};

const getByPrescription = async (prescriptionId) => Entity.findOne({ prescriptionId });

module.exports = { extractAndStoreEntities, getByPrescription };
