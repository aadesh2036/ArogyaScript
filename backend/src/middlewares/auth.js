const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const APIError = require('../utils/apiError');
const User = require('../modules/auth/model');

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) throw APIError.unauthorized('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) throw APIError.unauthorized('User no longer exists');

    req.user = user;
    next();
});

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return next(APIError.forbidden(`Role '${req.user?.role}' is not authorized`));
    }
    next();
};

const requireDoctor = requireRole('doctor');
const requirePharmacist = requireRole('pharmacist');
const requireAdmin = requireRole('admin');

module.exports = { protect, requireRole, requireDoctor, requirePharmacist, requireAdmin };
