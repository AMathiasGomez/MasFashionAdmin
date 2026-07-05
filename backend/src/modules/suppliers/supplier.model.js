const { pool } = require('../../config/database');
const { paginationClause } = require('../../utils/sql-pagination');

const execute = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return rows;
};

const buildWhere = (filters = {}) => {
  const where = [];
  const params = {};

  if (filters.search) {
    where.push('(name LIKE :search OR phone LIKE :search OR email LIKE :search)');
    params.search = `%${filters.search}%`;
  }

  if (filters.active !== undefined) {
    where.push('active = :active');
    params.active = filters.active === 'true' || filters.active === true ? 1 : 0;
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const supplierSelect = `
  SELECT
    id,
    name,
    phone,
    email,
    address,
    notes,
    active,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM suppliers
`;

const findAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);

  return execute(
    db,
    `${supplierSelect}
     ${whereSql}
     ORDER BY name ASC
     ${paginationClause(filters, 10, 100)}`,
    params
  );
};

const countAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(db, `SELECT COUNT(*) AS total FROM suppliers ${whereSql}`, params);
  return rows[0].total;
};

const findById = async (id, db = pool) => {
  const rows = await execute(db, `${supplierSelect} WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
};

const create = async (payload, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO suppliers (name, phone, email, address, notes, active)
     VALUES (:name, :phone, :email, :address, :notes, :active)`,
    {
      name: payload.name,
      phone: payload.phone || null,
      email: payload.email || null,
      address: payload.address || null,
      notes: payload.notes || null,
      active: payload.active === undefined ? 1 : Number(payload.active)
    }
  );

  return result.insertId;
};

const update = async (id, payload, db = pool) => {
  await execute(
    db,
    `UPDATE suppliers
     SET
       name = :name,
       phone = :phone,
       email = :email,
       address = :address,
       notes = :notes
     WHERE id = :id`,
    {
      id,
      name: payload.name,
      phone: payload.phone || null,
      email: payload.email || null,
      address: payload.address || null,
      notes: payload.notes || null
    }
  );
};

const updateStatus = async (id, active, db = pool) => {
  await execute(db, 'UPDATE suppliers SET active = :active WHERE id = :id', {
    id,
    active: Number(active)
  });
};

module.exports = {
  findAll,
  countAll,
  findById,
  create,
  update,
  updateStatus
};

