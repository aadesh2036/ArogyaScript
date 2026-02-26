const Event = require('./model');
const logger = require('../../utils/logger');

/**
 * Centralised event logger — called across all pipeline modules.
 */
const logEvent = async (eventType, prescriptionId, metadata = {}) => {
  try {
    await Event.create({ eventType, prescriptionId: prescriptionId || null, metadata });
  } catch (err) {
    // Non-fatal — log but do not throw
    logger.warn(`[Analytics] Failed to log event ${eventType}: ${err.message}`);
  }
};

const getSummary = async () => {
  return Event.aggregate([
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        latest: { $max: '$timestamp' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

const getByPrescription = async (prescriptionId) =>
  Event.find({ prescriptionId }).sort({ timestamp: -1 });

module.exports = { logEvent, getSummary, getByPrescription };
