const mongoose = require('mongoose');

const imageQualitySchema = new mongoose.Schema(
    {
        prescriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prescription',
            required: true,
            unique: true,
        },
        blurScore: { type: Number, default: null },
        brightnessScore: { type: Number, default: null },
        skewAngle: { type: Number, default: null },
        cropCoordinates: {
            x: Number,
            y: Number,
            width: Number,
            height: Number,
        },
        isReadable: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ImageQuality', imageQualitySchema);
