const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (user) => {
  const jti = crypto.randomUUID();

  const token = jwt.sign(
    {
      role: user.role_name,
      jti
    },
    env.jwt.secret,
    {
      subject: String(user.id),
      expiresIn: env.jwt.expiresIn,
      issuer: env.jwt.issuer
    }
  );

  const decoded = jwt.decode(token);

  return {
    token,
    jti,
    expiresAt: new Date(decoded.exp * 1000)
  };
};

const verifyToken = (token) =>
  jwt.verify(token, env.jwt.secret, {
    issuer: env.jwt.issuer
  });

module.exports = {
  signToken,
  verifyToken
};

