const interactionService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const getInteractions = asyncHandler(async (req, res) => {
  const data = await interactionService.getByPrescription(req.params.prescriptionId);
  res.json({ success: true, data });
});

const addKBEntry = asyncHandler(async (req, res) => {
  const data = await interactionService.addKBEntry(req.body);
  res.status(201).json({ success: true, data });
});

module.exports = { getInteractions, addKBEntry };
