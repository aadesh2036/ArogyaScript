const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
    },
    imagePath: { type: String, required: true },
    boundingBoxes: [
      {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
      },
    ],
    label: { type: String, default: '' },
    annotatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Annotation', annotationSchema);
