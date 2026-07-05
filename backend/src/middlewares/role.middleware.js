const { ApiError } = require('../utils/api-error');

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication is required'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  }

  return next();
};

const authorizePermissions = (...requiredPermissions) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication is required'));
  }

  const hasPermission = requiredPermissions.every((permission) =>
    req.user.permissions.includes(permission)
  );

  if (!hasPermission) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }

  return next();
};

module.exports = {
  authorizeRoles,
  authorizePermissions
};

