const { v4: uuidv4 } = require('uuid');
const Prescription = require('../models/Prescription.model');
const { generateMockAnalysis } = require('../utils/mockPipeline');

// POST /api/prescriptions/upload
exports.uploadPrescription = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const prescriptionId = `rx_${uuidv4().slice(0, 8)}`;

    // ── Round-1: use mock pipeline; Round-2: call real ML service ──
    const analysis = generateMockAnalysis(prescriptionId);

    const prescription = await Prescription.create({
      prescriptionId,
      userId: req.user._id,
      imagePath: req.file.filename,
      ...analysis,
    });

    res.status(201).json({
      success: true,
      message: 'Prescription analyzed successfully',
      data: prescription,
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
      .select('prescriptionId riskScore.overall riskScore.level extractedEntities createdAt');

    const data = prescriptions.map((p) => ({
      prescriptionId: p.prescriptionId,
      createdAt: p.createdAt,
      riskScore: p.riskScore.overall,
      riskLevel: p.riskScore.level,
      drugCount: p.extractedEntities.length,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/prescriptions/:id
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
