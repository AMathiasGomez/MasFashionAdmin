const { query } = require('../../config/database');

const userSelect = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.password_hash,
    r.name AS role_name,
    GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permissions
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
  LEFT JOIN permissions p ON p.id = rp.permission_id
`;

const findUserForLogin = async (email) => {
  const rows = await query(
    `${userSelect}
     WHERE u.email = :email AND u.active = 1
     GROUP BY u.id, u.name, u.email, u.password_hash, r.name
     LIMIT 1`,
    { email }
  );

  return rows[0] || null;
};

const findActiveUserById = async (id) => {
  const rows = await query(
    `${userSelect}
     WHERE u.id = :id AND u.active = 1
     GROUP BY u.id, u.name, u.email, u.password_hash, r.name
     LIMIT 1`,
    { id }
  );

  return rows[0] || null;
};

const revokeToken = async (userId, tokenJti, expiresAt) => {
  await query(
    `INSERT INTO revoked_tokens (user_id, token_jti, expires_at)
     VALUES (:userId, :tokenJti, :expiresAt)
     ON DUPLICATE KEY UPDATE revoked_at = CURRENT_TIMESTAMP`,
    { userId, tokenJti, expiresAt }
  );
};

const isTokenRevoked = async (tokenJti) => {
  const rows = await query(
    `SELECT id
     FROM revoked_tokens
     WHERE token_jti = :tokenJti
     LIMIT 1`,
    { tokenJti }
  );

  return rows.length > 0;
};

module.exports = {
  findUserForLogin,
  findActiveUserById,
  revokeToken,
  isTokenRevoked
};

