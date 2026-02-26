const router = require('express').Router();
const { create, getByPrescription, remove } = require('./controller');
const { protect } = require('../../middlewares/auth');

router.use(protect);
router.post('/', create);
router.get('/:prescriptionId', getByPrescription);
router.delete('/:id', remove);

module.exports = router;
