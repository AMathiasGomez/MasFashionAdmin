const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/api-error');

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg
  }));

  return next(new ApiError(422, 'Validation failed', errors));
};

module.exports = validateRequest;

