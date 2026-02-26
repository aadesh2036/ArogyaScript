const router = require('express').Router();
const { getAll, getOne, update, remove } = require('./controller');
const { protect, requireAdmin } = require('../../middlewares/auth');

router.use(protect, requireAdmin);
router.get('/', getAll);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
