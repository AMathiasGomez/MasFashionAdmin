const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/api-error');
const authModel = require('../modules/auth/auth.model');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token is required');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = verifyToken(token);
    const isRevoked = await authModel.isTokenRevoked(payload.jti);

    if (isRevoked) {
      throw new ApiError(401, 'Authentication token has been revoked');
    }

    const user = await authModel.findActiveUserById(payload.sub);

    if (!user) {
      throw new ApiError(401, 'User is not active or does not exist');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions ? user.permissions.split(',') : [],
      tokenJti: payload.jti,
      tokenExpiresAt: new Date(payload.exp * 1000)
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;

