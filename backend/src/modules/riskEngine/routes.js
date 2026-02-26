const router = require('express').Router();
const { getRisk } = require('./controller');
const { protect } = require('../../middlewares/auth');

router.use(protect);
router.get('/:prescriptionId', getRisk);

module.exports = router;
