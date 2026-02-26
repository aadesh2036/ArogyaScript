const imageQualityService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const getByPrescription = asyncHandler(async (req, res) => {
    const data = await imageQualityService.getByPrescription(req.params.prescriptionId);
    res.json({ success: true, data });
});

module.exports = { getByPrescription };
