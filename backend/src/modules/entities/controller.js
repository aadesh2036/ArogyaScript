const entityService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const getEntities = asyncHandler(async (req, res) => {
  const data = await entityService.getByPrescription(req.params.prescriptionId);
  res.json({ success: true, data });
});

module.exports = { getEntities };
