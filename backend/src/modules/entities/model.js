const mongoose = require('mongoose');

const drugEntrySchema = new mongoose.Schema({
  rawName: String,
  normalizedName: String,
  strength: String,
  frequency: String,
  duration: String,
  confidence: { type: Number, default: 0 },
}, { _id: false });

const entitySchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      unique: true,
    },
    drugs: [drugEntrySchema],
    doctorName: { type: String, default: null },
    patientName: { type: String, default: null },
    clinicName: { type: String, default: null },
    prescribedDate: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Entity', entitySchema);
