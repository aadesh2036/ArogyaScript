const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema(
  {
    drugName: { type: String, required: true },
    rawText: String,
    dosage: String,
    frequency: String,
    duration: String,
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const interactionSchema = new mongoose.Schema(
  {
    drug1: String,
    drug2: String,
    severity: { type: String, enum: ['low', 'moderate', 'high', 'critical'] },
    description: String,
    recommendation: String,
  },
  { _id: false }
);

const signalSchema = new mongoose.Schema(
  {
    signal: String,
    weight: Number,
    detail: String,
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imagePath: String,
    patientInfo: {
      name: String,
      age: Number,
      gender: { type: String, enum: ['M', 'F', 'Other'] },
    },
    extractedEntities: [entitySchema],
    interactions: [interactionSchema],
    riskScore: {
      overall: { type: Number, min: 0, max: 100 },
      level: { type: String, enum: ['safe', 'low', 'moderate', 'high', 'critical'] },
      signals: [signalSchema],
    },
    metadata: {
      ocrEngine: String,
      processingTimeMs: Number,
      imageQuality: { type: String, enum: ['poor', 'fair', 'good', 'excellent'] },
    },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'completed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
