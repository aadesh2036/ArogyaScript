const mongoose = require('mongoose');

const ocrOutputSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      unique: true,
    },
    rawText: { type: String, default: '' },
    averageConfidence: { type: Number, default: 0 },
    tokens: [
      {
        text: String,
        confidence: Number,
        bbox: {
          x: Number,
          y: Number,
          width: Number,
          height: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('OcrOutput', ocrOutputSchema);
