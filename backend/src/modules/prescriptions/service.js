const Prescription = require('./model');
const ConfigVersion = require('../configVersioning/model');
const APIError = require('../../utils/apiError');

const createPrescription = async ({ userId, imagePath, originalFileName }) => {
    // Attach the latest active config version
    const latestConfig = await ConfigVersion.findOne().sort({ createdAt: -1 });
    return Prescription.create({
        userId,
        imagePath,
        originalFileName,
        configVersionId: latestConfig?._id || null,
    });
};

const getPrescriptionById = async (id) => {
    const rx = await Prescription.findById(id).populate('userId', 'name email role').populate('configVersionId');
    if (!rx) throw APIError.notFound('Prescription not found');
    return rx;
};

const updateStatus = async (id, status, errorMessage = null) => {
    return Prescription.findByIdAndUpdate(id, { pipelineStatus: status, errorMessage }, { new: true });
};

const listByUser = async (userId) => Prescription.find({ userId }).sort({ createdAt: -1 });

module.exports = { createPrescription, getPrescriptionById, updateStatus, listByUser };
