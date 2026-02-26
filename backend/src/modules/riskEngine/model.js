const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      unique: true,
    },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    category: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'low',
    },
    configVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConfigVersion', default: null },
  },
  { timestamps: true }
);

const riskReasonSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      unique: true,
    },
    factors: [
      {
        type: { type: String },
        description: String,
        weight: Number,
        evidenceReference: String,
        sourceModule: {
          type: String,
          enum: ['OCR', 'Entity', 'Interaction', 'Config'],
        },
      },
    ],
  },
  { timestamps: true }
);

const RiskScore = mongoose.model('RiskScore', riskScoreSchema);
const RiskReason = mongoose.model('RiskReason', riskReasonSchema);

module.exports = { RiskScore, RiskReason };
