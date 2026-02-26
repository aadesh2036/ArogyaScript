const router = require('express').Router();
const { getOcrOutput } = require('./controller');
const { protect } = require('../../middlewares/auth');

router.use(protect);
router.get('/:prescriptionId', getOcrOutput);

module.exports = router;
