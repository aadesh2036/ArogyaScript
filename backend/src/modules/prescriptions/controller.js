const prescriptionService = require('./service');
const ocrService = require('../ocr/service');
const asyncHandler = require('../../utils/asyncHandler');
const APIError = require('../../utils/apiError');

// POST /api/prescriptions/upload
const upload = asyncHandler(async (req, res) => {
    if (!req.file) throw APIError.badRequest('No image file provided');

    const prescription = await prescriptionService.createPrescription({
        userId: req.user._id,
        imagePath: req.file.path,
        originalFileName: req.file.originalname,
    });

    res.status(201).json({ success: true, message: 'Prescription uploaded', data: prescription });
});

// POST /api/prescriptions/:id/process
const process = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const prescription = await prescriptionService.getPrescriptionById(id);

    // Kick off the pipeline asynchronously
    ocrService.runOCRPipeline(prescription).catch(() => {
        /* handled inside service */
    });

    res.json({ success: true, message: 'Pipeline triggered', prescriptionId: id });
});

// GET /api/prescriptions/:id
const getOne = asyncHandler(async (req, res) => {
    const prescription = await prescriptionService.getPrescriptionById(req.params.id);
    res.json({ success: true, data: prescription });
});

// GET /api/prescriptions/
const getMyPrescriptions = asyncHandler(async (req, res) => {
    const list = await prescriptionService.listByUser(req.user._id);
    res.json({ success: true, count: list.length, data: list });
});

module.exports = { upload, process, getOne, getMyPrescriptions };
