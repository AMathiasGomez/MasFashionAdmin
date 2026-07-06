const { pool } = require('../../config/database');
const { paginationClause } = require('../../utils/sql-pagination');

const execute = async (sql, params = {}) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const record = async ({ userId, action, entityType, entityId, details }) => {
  await execute(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
     VALUES (:userId, :action, :entityType, :entityId, :details)`,
    {
      userId: userId || null,
      action,
      entityType,
      entityId: entityId || null,
      details: details ? JSON.stringify(details) : null
    }
  );
};

const buildWhere = (filters = {}) => {
  const where = [];
  const params = {};

  if (filters.entityType) {
    where.push('a.entity_type = :entityType');
    params.entityType = filters.entityType;
  }

  if (filters.action) {
    where.push('a.action = :action');
    params.action = filters.action;
  }

  if (filters.userId) {
    where.push('a.user_id = :userId');
    params.userId = Number(filters.userId);
  }

  if (filters.from) {
    where.push('DATE(a.created_at) >= :from');
    params.from = filters.from;
  }

  if (filters.to) {
    where.push('DATE(a.created_at) <= :to');
    params.to = filters.to;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const findAll = async (filters = {}) => {
  const { whereSql, params } = buildWhere(filters);

  return execute(
    `SELECT
       a.id,
       a.user_id AS userId,
       u.name AS userName,
       a.action,
       a.entity_type AS entityType,
       a.entity_id AS entityId,
       a.details,
       a.created_at AS createdAt
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ${whereSql}
     ORDER BY a.created_at DESC
     ${paginationClause(filters, 20, 100)}`,
    params
  );
};

const countAll = async (filters = {}) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(
    `SELECT COUNT(*) AS total FROM audit_logs a ${whereSql}`,
    params
  );

  return rows[0].total;
};

module.exports = {
  record,
  findAll,
  countAll
};
