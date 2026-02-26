const router = require('express').Router();
const { upload: uploadCtrl, process: processCtrl, getOne, getMyPrescriptions } = require('./controller');
const { protect } = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');

router.use(protect);
router.get('/', getMyPrescriptions);
router.post('/upload', upload.single('image'), uploadCtrl);
router.post('/:id/process', processCtrl);
router.get('/:id', getOne);

module.exports = router;
