const { body } = require('express-validator');

const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['doctor', 'pharmacist', 'patient', 'admin'])
        .withMessage('Invalid role'),
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidation, loginValidation };
