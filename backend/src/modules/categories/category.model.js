const { pool } = require('../../config/database');

const execute = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return rows;
};

const categorySelect = `
  SELECT
    id,
    name,
    description,
    active,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM categories
`;

const findAll = async (filters = {}, db = pool) => {
  const where = [];
  const params = {};

  if (filters.active !== undefined) {
    where.push('active = :active');
    params.active = filters.active === 'true' || filters.active === true ? 1 : 0;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  return execute(
    db,
    `${categorySelect}
     ${whereSql}
     ORDER BY name ASC`,
    params
  );
};

const findById = async (id, db = pool) => {
  const rows = await execute(db, `${categorySelect} WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
};

const create = async (payload, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO categories (name, description, active)
     VALUES (:name, :description, :active)`,
    {
      name: payload.name,
      description: payload.description || null,
      active: payload.active === undefined ? 1 : Number(payload.active)
    }
  );

  return result.insertId;
};

const update = async (id, payload, db = pool) => {
  await execute(
    db,
    `UPDATE categories
     SET name = :name,
         description = :description,
         active = COALESCE(:active, active)
     WHERE id = :id`,
    {
      id,
      name: payload.name,
      description: payload.description || null,
      active: payload.active === undefined ? null : Number(payload.active)
    }
  );
};

const updateStatus = async (id, active, db = pool) => {
  await execute(db, 'UPDATE categories SET active = :active WHERE id = :id', {
    id,
    active: Number(active)
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateStatus
};
