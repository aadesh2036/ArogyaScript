const riskService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const getRisk = asyncHandler(async (req, res) => {
  const data = await riskService.getRiskSummary(req.params.prescriptionId);
  res.json({ success: true, data });
});

module.exports = { getRisk };
