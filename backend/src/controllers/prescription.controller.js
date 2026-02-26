const { v4: uuidv4 } = require('uuid');
const Prescription = require('../models/Prescription.model');
const { runPipeline } = require('../services/pipelineOrchestrator');
const { createLogger } = require('../utils/logger');

const log = createLogger('PrescriptionCtrl');

// POST /api/prescriptions/upload
exports.uploadPrescription = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const prescriptionId = `rx_${uuidv4().slice(0, 8)}`;
    const imagePath = req.file.filename;

    // Create initial DB record with 'processing' status
    const prescription = await Prescription.create({
      prescriptionId,
      userId: req.user._id,
      imagePath,
      status: 'processing',
      pipelineStatus: { overall: 'queued' },
    });

    // Return immediately with job ID — pipeline runs async
    res.status(201).json({
      success: true,
      message: 'Prescription uploaded. Analysis in progress.',
      data: {
        prescriptionId,
        status: 'processing',
        pipelineStatus: { overall: 'queued' },
      },
    });

    // Run pipeline in the background (fire-and-forget)
    runPipeline(prescriptionId, imagePath).catch((err) => {
      log.error('Background pipeline failed', { prescriptionId, error: err.message });
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/prescriptions/:id/status  — lightweight polling endpoint
exports.getPipelineStatus = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({
      prescriptionId: req.params.id,
      userId: req.user._id,
    }).select('prescriptionId status pipelineStatus');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({
      success: true,
      data: {
        prescriptionId: prescription.prescriptionId,
        status: prescription.status,
        pipelineStatus: prescription.pipelineStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/prescriptions
exports.getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('prescriptionId riskScore.overall riskScore.level extractedEntities status pipelineStatus createdAt');

    const data = prescriptions.map((p) => ({
      prescriptionId: p.prescriptionId,
      createdAt: p.createdAt,
      riskScore: p.riskScore?.overall ?? null,
      riskLevel: p.riskScore?.level ?? null,
      drugCount: p.extractedEntities?.length ?? 0,
      status: p.status,
      pipelineStatus: p.pipelineStatus?.overall ?? 'unknown',
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/prescriptions/:id  — full result
exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({
      prescriptionId: req.params.id,
      userId: req.user._id,
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, data: prescription });
  } catch (err) {
    next(err);
  }
};
