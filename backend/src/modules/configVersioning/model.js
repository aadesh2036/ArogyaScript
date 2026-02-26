const mongoose = require('mongoose');

const configVersionSchema = new mongoose.Schema(
  {
    versionName: { type: String, required: true, unique: true, trim: true },
    interactionWeight: { type: Number, default: 0.35 },
    ocrConfidenceThreshold: { type: Number, default: 0.75 },
    dosageAnomalyThreshold: { type: Number, default: 0.6 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConfigVersion', configVersionSchema);
