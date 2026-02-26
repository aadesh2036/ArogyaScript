const router = require('express').Router();
const { getEntities } = require('./controller');
const { protect } = require('../../middlewares/auth');

router.use(protect);
router.get('/:prescriptionId', getEntities);

module.exports = router;
