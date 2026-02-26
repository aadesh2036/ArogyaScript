const { InteractionKB, InteractionResult } = require('./model');
const Entity = require('../entities/model');
const analyticsService = require('../analytics/service');
const { eventBus, EVENTS } = require('../../utils/eventBus');
const logger = require('../../utils/logger');

/**
 * Generate all unique drug pairs from an array of drug names.
 * e.g. ['A','B','C'] → [['A','B'], ['A','C'], ['B','C']]
 */
const generateDrugPairs = (drugs) => {
  const pairs = [];
  for (let i = 0; i < drugs.length; i++) {
    for (let j = i + 1; j < drugs.length; j++) {
      pairs.push([drugs[i], drugs[j]]);
    }
  }
  return pairs;
};

/**
 * Drug Interaction Service:
 * 1. Load drugs from entities
 * 2. Generate all pairs
 * 3. Lookup interaction_kb for each pair (both directions)
 * 4. Store results in interaction_results
 * 5. Emit INTERACTION_ANALYZED
 */
const analyzeInteractions = async (prescription, entityDoc) => {
  try {
    logger.info(`[Interaction] Analyzing for prescription: ${prescription._id}`);

    const drugs = (entityDoc?.drugs || []).map((d) => d.normalizedName?.toLowerCase()).filter(Boolean);
    const pairs = generateDrugPairs(drugs);

    const interactions = [];
    for (const [drugA, drugB] of pairs) {
      const hit = await InteractionKB.findOne({
        $or: [
          { drugA, drugB },
          { drugA: drugB, drugB: drugA },
        ],
      });
      if (hit) {
        interactions.push({
          drugA: hit.drugA,
          drugB: hit.drugB,
          severity: hit.severity,
          mechanism: hit.mechanism,
          recommendation: hit.recommendation,
        });
      }
    }

    const resultDoc = await InteractionResult.findOneAndUpdate(
      { prescriptionId: prescription._id },
      { prescriptionId: prescription._id, interactions },
      { upsert: true, new: true }
    );

    await analyticsService.logEvent('INTERACTION_ANALYZED', prescription._id, {
      pairsChecked: pairs.length,
      interactionsFound: interactions.length,
      highSeverityCount: interactions.filter((i) => i.severity === 'high').length,
    });

    eventBus.emit(EVENTS.INTERACTION_ANALYZED, { prescription, resultDoc });
    logger.info(`[Interaction] Found ${interactions.length} interactions for prescription: ${prescription._id}`);
    return resultDoc;
  } catch (err) {
    logger.error(`[Interaction] Failed for ${prescription._id}: ${err.message}`);
    throw err;
  }
};

const getByPrescription = async (prescriptionId) => InteractionResult.findOne({ prescriptionId });

const addKBEntry = async (data) => {
  return InteractionKB.findOneAndUpdate(
    { drugA: data.drugA.toLowerCase(), drugB: data.drugB.toLowerCase() },
    data,
    { upsert: true, new: true }
  );
};

module.exports = { analyzeInteractions, getByPrescription, addKBEntry, generateDrugPairs };
