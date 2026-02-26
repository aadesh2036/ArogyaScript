/**
 * Wraps async route handlers so errors are forwarded to Express error middleware.
 * Usage: router.get('/route', asyncHandler(myController))
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
