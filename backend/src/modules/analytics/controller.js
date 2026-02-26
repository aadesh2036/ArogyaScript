const analyticsService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const getSummary = asyncHandler(async (req, res) => {
  const data = await analyticsService.getSummary();
  res.json({ success: true, data });
});

const getByPrescription = asyncHandler(async (req, res) => {
  const data = await analyticsService.getByPrescription(req.params.prescriptionId);
  res.json({ success: true, data });
});

module.exports = { getSummary, getByPrescription };
