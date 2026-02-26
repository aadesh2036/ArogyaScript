const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./model');
const APIError = require('../../utils/apiError');

const generateToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const register = async ({ name, email, password, role }) => {
    const existing = await User.findOne({ email });
    if (existing) throw APIError.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });

    const token = generateToken(user._id);
    return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

const login = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw APIError.unauthorized('Invalid credentials');

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw APIError.unauthorized('Invalid credentials');

    const token = generateToken(user._id);
    return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

module.exports = { register, login };
