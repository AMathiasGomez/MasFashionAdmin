const { ApiError } = require('../utils/api-error');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || statusCode < 500;

  if (!isOperational) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : 'Internal server error',
    errors: error.errors || undefined
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

