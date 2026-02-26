const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  uploadPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPipelineStatus,
} = require('../controllers/prescription.controller');

router.use(protect);

router.post('/upload', upload.single('image'), uploadPrescription);
router.get('/', getPrescriptions);
router.get('/:id', getPrescriptionById);
router.get('/:id/status', getPipelineStatus);

module.exports = router;
