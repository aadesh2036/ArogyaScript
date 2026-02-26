const { validationResult } = require('express-validator');
const authService = require('./service');
const APIError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw APIError.badRequest('Validation failed', errors.array());

    const result = await authService.register(req.body);
    res.status(201).json({ success: true, message: 'Registration successful', data: result });
});

const login = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw APIError.badRequest('Validation failed', errors.array());

    const result = await authService.login(req.body);
    res.status(200).json({ success: true, message: 'Login successful', data: result });
});

const me = asyncHandler(async (req, res) => {
    res.status(200).json({ success: true, data: req.user });
});

module.exports = { register, login, me };
