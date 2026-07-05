const authModel = require('./auth.model');
const { ApiError } = require('../../utils/api-error');
const { comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');

const login = async ({ email, password }) => {
  const user = await authModel.findUserForLogin(email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.password_hash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { token, jti, expiresAt } = signToken(user);

  return {
    accessToken: token,
    tokenType: 'Bearer',
    expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions ? user.permissions.split(',') : []
    },
    sessionId: jti
  };
};

const logout = async (user) => {
  await authModel.revokeToken(user.id, user.tokenJti, user.tokenExpiresAt);
};

module.exports = {
  login,
  logout
};

