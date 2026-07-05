const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  namedPlaceholders: true,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  namedPlaceholders: true,
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

