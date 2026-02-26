const ocrService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const getOcrOutput = asyncHandler(async (req, res) => {
  const data = await ocrService.getByPrescription(req.params.prescriptionId);
  res.json({ success: true, data });
});

module.exports = { getOcrOutput };
