const mongoose = require('mongoose');

// Interaction Knowledge Base
const interactionKBSchema = new mongoose.Schema(
  {
    drugA: { type: String, required: true, lowercase: true, trim: true },
    drugB: { type: String, required: true, lowercase: true, trim: true },
    severity: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: true,
    },
    mechanism: { type: String, default: '' },
    recommendation: { type: String, default: '' },
  },
  { timestamps: true }
);
interactionKBSchema.index({ drugA: 1, drugB: 1 }, { unique: true });

// Interaction Results per prescription
const interactionResultSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      unique: true,
    },
    interactions: [
      {
        drugA: String,
        drugB: String,
        severity: { type: String, enum: ['low', 'moderate', 'high'] },
        mechanism: String,
        recommendation: String,
      },
    ],
  },
  { timestamps: true }
);

const InteractionKB = mongoose.model('InteractionKB', interactionKBSchema);
const InteractionResult = mongoose.model('InteractionResult', interactionResultSchema);

module.exports = { InteractionKB, InteractionResult };
