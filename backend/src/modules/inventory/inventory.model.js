const { pool } = require('../../config/database');
const { paginationClause } = require('../../utils/sql-pagination');

// CLAVE: Ajustamos execute para que procese arrays ordenados nativos de MySQL
const execute = async (db, sql, params = []) => {
  const [rows] = await db.execute(sql, params);
  return rows;
};

const findLowStockProducts = async (db = pool) =>
  execute(
    db,
    `SELECT
       p.id,
       p.name,
       c.name AS categoryName,
       p.size,
       p.color,
       p.stock,
       p.min_stock AS minStock,
       p.active
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.active = 1 AND p.stock <= p.min_stock
     ORDER BY (p.min_stock - p.stock) DESC, p.name ASC`,
    [] // Pasamos array vacío al no requerir parámetros
  );

// CLAVE: Modificamos buildMovementWhere para recolectar filtros en un Array ordenado
const buildMovementWhere = (filters = {}) => {
  const where = [];
  const params = []; // Ahora es un array plano nativo

  if (filters.productId) {
    where.push('im.product_id = ?');
    params.push(Number(filters.productId));
  }

  if (filters.movementType) {
    where.push('im.movement_type = ?');
    params.push(filters.movementType);
  }

  if (filters.from) {
    where.push('DATE(im.created_at) >= ?');
    params.push(filters.from);
  }

  if (filters.to) {
    where.push('DATE(im.created_at) <= ?');
    params.push(filters.to);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const movementSelect = `
  SELECT
    im.id,
    im.product_id AS productId,
    p.name AS productName,
    im.user_id AS userId,
    u.name AS userName,
    im.movement_type AS movementType,
    im.quantity,
    im.previous_stock AS previousStock,
    im.new_stock AS newStock,
    im.reason,
    im.reference_type AS referenceType,
    im.reference_id AS referenceId,
    im.created_at AS createdAt
  FROM inventory_movements im
  JOIN products p ON p.id = im.product_id
  JOIN users u ON u.id = im.user_id
`;

const findMovements = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildMovementWhere(filters);

  return execute(
    db,
    `${movementSelect}
     ${whereSql}
     ORDER BY im.created_at DESC
     ${paginationClause(filters, 20, 100)}`,
    params
  );
};

const countMovements = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildMovementWhere(filters);
  const rows = await execute(
    db,
    `SELECT COUNT(*) AS total
     FROM inventory_movements im
     ${whereSql}`,
    params // Array limpio generado automáticamente
  );

  return rows[0].total;
};

const findProductForUpdate = async (productId, db = pool) => {
  const rows = await execute(
    db,
    `SELECT id, stock
     FROM products
     WHERE id = ? AND active = 1
     FOR UPDATE`,
    [productId]
  );

  return rows[0] || null;
};

const updateProductStock = async (productId, stock, db = pool) => {
  await execute(
    db,
    `UPDATE products
     SET stock = ?
     WHERE id = ?`,
    [stock, productId] // Mismo orden posicional que los '?' en el SQL
  );
};

const createMovement = async (payload, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO inventory_movements (
        product_id,
        user_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reason,
        reference_type,
        reference_id
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.productId,
      payload.userId,
      payload.movementType,
      payload.quantity,
      payload.previousStock,
      payload.newStock,
      payload.reason,
      payload.referenceType,
      payload.referenceId
    ]
  );

  return result.insertId;
};

const findMovementById = async (id, db = pool) => {
  const rows = await execute(
    db,
    `${movementSelect}
     WHERE im.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

module.exports = {
  findLowStockProducts,
  findMovements,
  countMovements,
  findProductForUpdate,
  updateProductStock,
  createMovement,
  findMovementById
};