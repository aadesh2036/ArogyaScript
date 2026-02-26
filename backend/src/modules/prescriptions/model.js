const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'userId is required'],
        },
        imagePath: {
            type: String,
            required: [true, 'imagePath is required'],
        },
        originalFileName: {
            type: String,
        },
        pipelineStatus: {
            type: String,
            enum: ['uploaded', 'processing', 'processed', 'failed'],
            default: 'uploaded',
        },
        configVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ConfigVersion',
            default: null,
        },
        errorMessage: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);
