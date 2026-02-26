const mongoose = require('mongoose');

const drugSynonymSchema = new mongoose.Schema(
  {
    genericName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    brandNames: [{ type: String, lowercase: true, trim: true }],
    synonyms: [{ type: String, lowercase: true, trim: true }],
  },
  { timestamps: true }
);

drugSynonymSchema.index({ genericName: 'text', brandNames: 'text', synonyms: 'text' });

module.exports = mongoose.model('DrugSynonym', drugSynonymSchema);
