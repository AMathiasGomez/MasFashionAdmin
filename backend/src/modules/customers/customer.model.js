const { pool } = require('../../config/database');
const { limitClause, paginationClause } = require('../../utils/sql-pagination');

const execute = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return rows;
};

const buildWhere = (filters = {}) => {
  const where = [];
  const params = {};

  if (filters.search) {
    where.push('(c.name LIKE :search OR c.phone LIKE :search OR c.instagram LIKE :search)');
    params.search = `%${filters.search}%`;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const summarySelect = `
  SELECT
    c.id,
    c.name,
    c.phone,
    c.instagram,
    c.address,
    c.notes,
    COUNT(o.id) AS ordersCount,
    COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS totalSpent,
    MAX(o.created_at) AS lastOrderAt,
    c.created_at AS createdAt,
    c.updated_at AS updatedAt
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
`;

const summaryGroup = `
  GROUP BY c.id, c.name, c.phone, c.instagram, c.address, c.notes, c.created_at, c.updated_at
`;

const findAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);

  return execute(
    db,
    `${summarySelect}
     ${whereSql}
     ${summaryGroup}
     ORDER BY c.created_at DESC
     ${paginationClause(filters)}`,
    params
  );
};

const countAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(
    db,
    `SELECT COUNT(*) AS total
     FROM customers c
     ${whereSql}`,
    params
  );

  return rows[0].total;
};

const findFrequentCustomers = async (filters = {}, db = pool) =>
  execute(
    db,
    `${summarySelect}
     ${summaryGroup}
     HAVING ordersCount > 0
     ORDER BY ordersCount DESC, totalSpent DESC
     ${limitClause(filters.limit, 10, 50)}`
  );

const findById = async (id, db = pool) => {
  const rows = await execute(
    db,
    `${summarySelect}
     WHERE c.id = :id
     ${summaryGroup}
     LIMIT 1`,
    { id }
  );

  if (!rows[0]) {
    return null;
  }

  const orders = await execute(
    db,
    `SELECT
       id,
       total,
       status,
       payment_method AS paymentMethod,
       created_at AS createdAt
     FROM orders
     WHERE customer_id = :id
     ORDER BY created_at DESC
     LIMIT 20`,
    { id }
  );

  return {
    ...rows[0],
    recentOrders: orders
  };
};

const create = async (payload, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO customers (name, phone, instagram, address, notes)
     VALUES (:name, :phone, :instagram, :address, :notes)`,
    {
      name: payload.name,
      phone: payload.phone || null,
      instagram: payload.instagram || null,
      address: payload.address || null,
      notes: payload.notes || null
    }
  );

  return result.insertId;
};

const update = async (id, payload, db = pool) => {
  await execute(
    db,
    `UPDATE customers
     SET
       name = :name,
       phone = :phone,
       instagram = :instagram,
       address = :address,
       notes = :notes
     WHERE id = :id`,
    {
      id,
      name: payload.name,
      phone: payload.phone || null,
      instagram: payload.instagram || null,
      address: payload.address || null,
      notes: payload.notes || null
    }
  );
};

const remove = async (id, db = pool) => {
  await execute(db, 'DELETE FROM customers WHERE id = :id', { id });
};

module.exports = {
  findAll,
  countAll,
  findFrequentCustomers,
  findById,
  create,
  update,
  remove
};

