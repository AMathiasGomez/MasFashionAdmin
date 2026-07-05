const { pool, query } = require('../config/database');
const { hashPassword } = require('../utils/password');

const createAdmin = async () => {
  const name = process.env.ADMIN_NAME || 'Administrador';
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must have at least 8 characters');
  }

  const roles = await query('SELECT id FROM roles WHERE name = :name LIMIT 1', {
    name: 'administrator'
  });

  if (!roles[0]) {
    throw new Error('Administrator role does not exist. Run database/schema.sql first.');
  }

  const passwordHash = await hashPassword(password);

  await query(
    `INSERT INTO users (role_id, name, email, password_hash, active)
     VALUES (:roleId, :name, :email, :passwordHash, 1)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       active = 1,
       role_id = VALUES(role_id)`,
    {
      roleId: roles[0].id,
      name,
      email,
      passwordHash
    }
  );

  console.log(`Administrator user ready: ${email}`);
};

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

