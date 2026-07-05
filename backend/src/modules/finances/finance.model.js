const { pool } = require('../../config/database');
const { paginationClause } = require('../../utils/sql-pagination');

// CLAVE: Ajustamos execute para recibir y manejar parámetros posicionales en arrays planos
const execute = async (db, sql, params = []) => {
  const [rows] = await db.execute(sql, params);
  return rows;
};

// CLAVE: Modificamos buildWhere para recolectar los filtros dinámicos en un Array ordenado
const buildWhere = (filters = {}) => {
  const where = [];
  const params = []; // Ahora es un array plano nativo

  if (filters.type) {
    where.push('type = ?');
    params.push(filters.type);
  }

  if (filters.category) {
    where.push('category = ?');
    params.push(filters.category);
  }

  if (filters.from) {
    where.push('transaction_date >= ?');
    params.push(filters.from);
  }

  if (filters.to) {
    where.push('transaction_date <= ?');
    params.push(filters.to);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const getSummary = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(
    db,
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS netProfit
     FROM financial_transactions
     ${whereSql}`,
    params // Pasa el array ordenado directamente
  );

  const monthly = await execute(
    db,
    `SELECT
       DATE_FORMAT(transaction_date, '%Y-%m') AS month,
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses,
       SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS netProfit
     FROM financial_transactions
     ${whereSql}
     GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
     ORDER BY month ASC`,
    params // Reutiliza el mismo array de filtros ordenados
  );

  return {
    ...rows[0],
    monthly
  };
};

const findTransactions = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);

  return execute(
    db,
    `SELECT
       id,
       type,
       category,
       amount,
       description,
       reference_type AS referenceType,
       reference_id AS referenceId,
       transaction_date AS transactionDate,
       created_at AS createdAt
     FROM financial_transactions
     ${whereSql}
     ORDER BY transaction_date DESC, id DESC
     ${paginationClause(filters, 20, 100)}`,
    params
  );
};

const countTransactions = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(
    db,
    `SELECT COUNT(*) AS total
     FROM financial_transactions
     ${whereSql}`,
    params // Array limpio autogenerado
  );

  return rows[0].total;
};

const createTransaction = async (payload, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO financial_transactions (
       type,
       category,
       amount,
       description,
       reference_type,
       reference_id,
       transaction_date
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`, // Reemplazados por '?' nativos
    [
      payload.type,
      payload.category,
      payload.amount,
      payload.description || null,
      payload.referenceType,
      payload.referenceId,
      payload.transactionDate
    ]
  );

  return result.insertId;
};

const removeTransaction = async (id, db = pool) => {
  await execute(db, 'DELETE FROM financial_transactions WHERE id = ?', [id]);
};

const findTransactionById = async (id, db = pool) => {
  const rows = await execute(
    db,
    `SELECT
       id,
       type,
       category,
       amount,
       description,
       reference_type AS referenceType,
       reference_id AS referenceId,
       transaction_date AS transactionDate,
       created_at AS createdAt
     FROM financial_transactions
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

module.exports = {
  getSummary,
  findTransactions,
  countTransactions,
  createTransaction,
  removeTransaction,
  findTransactionById
};