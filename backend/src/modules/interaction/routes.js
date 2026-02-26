const router = require('express').Router();
const { getInteractions, addKBEntry } = require('./controller');
const { protect, requireAdmin } = require('../../middlewares/auth');

router.use(protect);
router.get('/:prescriptionId', getInteractions);
router.post('/kb', requireAdmin, addKBEntry);

module.exports = router;
