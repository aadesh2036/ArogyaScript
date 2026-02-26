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

// ── Gemini Explainability Schemas ────────────────────────────

const geminiInterventionSchema = new mongoose.Schema(
  {
    priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'] },
    action_type: String,
    message: String,
    related_drugs: [String],
    evidence: String,
  },
  { _id: false }
);

const geminiInteractionExplanationSchema = new mongoose.Schema(
  {
    drugA: String,
    drugB: String,
    severity: { type: String, enum: ['low', 'moderate', 'high', 'critical', 'unknown'] },
    mechanism: String,
    clinical_significance: String,
    evidence_basis: String,
    uncertain: Boolean,
  },
  { _id: false }
);

const geminiAnomalyExplanationSchema = new mongoose.Schema(
  {
    signal_name: String,
    score: Number,
    clinical_meaning: String,
    suggested_cause: String,
    uncertain: Boolean,
  },
  { _id: false }
);

const geminiUncertaintyFlagSchema = new mongoose.Schema(
  {
    field: String,
    reason: String,
    impact: String,
  },
  { _id: false }
);

const geminiOcrUncertaintySchema = new mongoose.Schema(
  {
    text: String,
    confidence: Number,
    concern: String,
  },
  { _id: false }
);

const geminiReasoningSchema = new mongoose.Schema(
  {
    explainability_summary: String,
    interaction_explanations: [geminiInteractionExplanationSchema],
    anomaly_explanations: [geminiAnomalyExplanationSchema],
    interventions: [geminiInterventionSchema],
    uncertainty_flags: [geminiUncertaintyFlagSchema],
    ocr_uncertainty_flags: [geminiOcrUncertaintySchema],
    entity_reconciliation: {
      missing_fields: [String],
      ambiguous_entities: [String],
      notes: String,
    },
    gemini_status: {
      type: String,
      enum: ['success', 'failed', 'skipped'],
      default: 'skipped',
    },
    reasoning_version: { type: String, default: 'gemini_reasoning_v1' },
    durationMs: Number,
    error: String,
    generatedAt: Date,
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

    // Gemini Explainable AI output
    geminiReasoning: geminiReasoningSchema,

    // Pipeline tracking
    pipelineStatus: {
      ocr: moduleStatusSchema,
      structuring: moduleStatusSchema,
      anomaly: moduleStatusSchema,
      intervention: moduleStatusSchema,
      gemini: moduleStatusSchema,
      overall: { type: String, enum: ['queued', 'processing', 'completed', 'partial', 'failed'], default: 'queued' },
    },

    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
