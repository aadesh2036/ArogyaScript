const router = require('express').Router();
const { register, login, me } = require('./controller');
const { registerValidation, loginValidation } = require('./validation');
const { protect } = require('../../middlewares/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, me);

module.exports = router;
