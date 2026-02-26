const ImageQuality = require('./model');

const saveQualityData = async (prescriptionId, data) => {
    return ImageQuality.findOneAndUpdate(
        { prescriptionId },
        { prescriptionId, ...data },
        { upsert: true, new: true }
    );
};

const getByPrescription = async (prescriptionId) =>
    ImageQuality.findOne({ prescriptionId });

module.exports = { saveQualityData, getByPrescription };
