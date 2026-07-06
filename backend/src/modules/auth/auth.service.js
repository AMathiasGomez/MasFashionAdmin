const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const authModel = require('./auth.model');
const env = require('../../config/env');
const { ApiError } = require('../../utils/api-error');
const { comparePassword, hashPassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');

const DEFAULT_REGISTRATION_ROLE = 'seller';

const googleClient = new OAuth2Client(env.google.clientId);

const buildSession = (user) => {
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

const login = async ({ email, password }) => {
  const user = await authModel.findUserForLogin(email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.password_hash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return buildSession(user);
};

const register = async ({ name, email, password }) => {
  const alreadyExists = await authModel.emailExists(email);

  if (alreadyExists) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const role = await authModel.findRoleByName(DEFAULT_REGISTRATION_ROLE);

  if (!role) {
    throw new ApiError(500, 'Default registration role is not configured');
  }

  const passwordHash = await hashPassword(password);
  const user = await authModel.createUser({ name, email, passwordHash, roleId: role.id });

  return buildSession(user);
};

const loginWithGoogle = async (credential) => {
  if (!env.google.clientId) {
    throw new ApiError(500, 'Google sign-in is not configured');
  }

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.google.clientId
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, 'Invalid Google credential');
  }

  if (!payload?.email || !payload.email_verified) {
    throw new ApiError(401, 'Google account email is not verified');
  }

  let user = await authModel.findUserForLogin(payload.email);

  if (!user) {
    const role = await authModel.findRoleByName(DEFAULT_REGISTRATION_ROLE);

    if (!role) {
      throw new ApiError(500, 'Default registration role is not configured');
    }

    const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
    user = await authModel.createUser({
      name: payload.name || payload.email,
      email: payload.email,
      passwordHash,
      roleId: role.id
    });
  }

  return buildSession(user);
};

const logout = async (user) => {
  await authModel.revokeToken(user.id, user.tokenJti, user.tokenExpiresAt);
};

module.exports = {
  login,
  register,
  loginWithGoogle,
  logout
};

