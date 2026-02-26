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

const anomalyFlagSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    message: String,
    detail: String,
    drugName: String,
  },
  { _id: false }
);

const interventionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    message: String,
    relatedDrugs: [String],
  },
  { _id: false }
);

const moduleStatusSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['success', 'failed', 'skipped'], default: 'success' },
    error: String,
    durationMs: Number,
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imagePath: String,
    processedImagePath: String,

    // OCR output
    ocrText: { type: String, default: '' },
    ocrConfidence: { type: Number, min: 0, max: 1 },

    patientInfo: {
      name: String,
      age: Number,
      gender: { type: String, enum: ['M', 'F', 'Other'] },
    },

    // Structured extraction
    extractedEntities: [entitySchema],

    // Interactions (from ML or rules)
    interactions: [interactionSchema],

    // Anomaly flags
    anomalyFlags: [anomalyFlagSchema],

    // Interventions
    interventions: [interventionSchema],

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

    // Pipeline tracking
    pipelineStatus: {
      ocr: moduleStatusSchema,
      structuring: moduleStatusSchema,
      anomaly: moduleStatusSchema,
      intervention: moduleStatusSchema,
      overall: { type: String, enum: ['queued', 'processing', 'completed', 'partial', 'failed'], default: 'queued' },
    },

    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
