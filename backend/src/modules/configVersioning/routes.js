const router = require('express').Router();
const { listAll, create, getOne } = require('./controller');
const { protect, requireAdmin } = require('../../middlewares/auth');

router.use(protect);
router.get('/', listAll);
router.get('/:id', getOne);
router.post('/', requireAdmin, create);

module.exports = router;
