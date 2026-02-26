const router = require('express').Router();
const { register, login, getMe, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

module.exports = router;
