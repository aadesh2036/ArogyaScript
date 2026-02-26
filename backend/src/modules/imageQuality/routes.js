const router = require('express').Router();
const { getByPrescription } = require('./controller');
const { protect } = require('../../middlewares/auth');

router.use(protect);
router.get('/:prescriptionId', getByPrescription);

module.exports = router;
