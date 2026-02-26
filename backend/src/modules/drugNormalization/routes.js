const router = require('express').Router();
const { listAll, getSynonym, addSynonym, normalize } = require('./controller');
const { protect, requireAdmin } = require('../../middlewares/auth');

router.use(protect);
router.get('/', listAll);
router.get('/normalize', normalize);
router.get('/:genericName', getSynonym);
router.post('/', requireAdmin, addSynonym);

module.exports = router;
