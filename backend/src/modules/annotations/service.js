const Annotation = require('./model');

const createAnnotation = async (data) => Annotation.create(data);

const getByPrescription = async (prescriptionId) =>
  Annotation.find({ prescriptionId }).populate('annotatedBy', 'name email');

const deleteAnnotation = async (id) => Annotation.findByIdAndDelete(id);

module.exports = { createAnnotation, getByPrescription, deleteAnnotation };
