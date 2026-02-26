const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null,
    },
    eventType: { type: String, required: true, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

eventSchema.index({ prescriptionId: 1, eventType: 1 });
eventSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Event', eventSchema);
