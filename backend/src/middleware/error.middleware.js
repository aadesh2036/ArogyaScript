exports.errorHandler = (err, _req, res, _next) => {
  console.error('ERROR →', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};
