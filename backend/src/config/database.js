const mysql = require('mysql2/promise');
const env = require('./env');

const resolveDbConfig = () => {
  if (!env.db.url) {
    return {
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database
    };
  }

  const parsed = new URL(env.db.url);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    // This project always uses its own "clothing_admin" database regardless of
    // the default database name embedded in the connection URL.
    database: env.db.database
  };
};

const pool = mysql.createPool({
  ...resolveDbConfig(),
  namedPlaceholders: true,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  decimalNumbers: true
});

const query = async (sql, params = {}) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const withTransaction = async (callback) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const testDatabaseConnection = async () => {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
};

module.exports = {
  pool,
  query,
  withTransaction,
  testDatabaseConnection
};

