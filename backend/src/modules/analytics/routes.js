const router = require('express').Router();
const { getSummary, getByPrescription } = require('./controller');
const { protect, requireAdmin } = require('../../middlewares/auth');

router.use(protect);
router.get('/summary', requireAdmin, getSummary);
router.get('/:prescriptionId', getByPrescription);

module.exports = router;
