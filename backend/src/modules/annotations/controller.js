const annotationService = require('./service');
const asyncHandler = require('../../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const annotation = await annotationService.createAnnotation({ ...req.body, annotatedBy: req.user._id });
  res.status(201).json({ success: true, data: annotation });
});

const getByPrescription = asyncHandler(async (req, res) => {
  const data = await annotationService.getByPrescription(req.params.prescriptionId);
  res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
  await annotationService.deleteAnnotation(req.params.id);
  res.json({ success: true, message: 'Annotation deleted' });
});

module.exports = { create, getByPrescription, remove };
