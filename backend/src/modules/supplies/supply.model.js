const { pool } = require('../../config/database');
const { paginationClause } = require('../../utils/sql-pagination');

// CLAVE 2: Modificamos execute para que funcione con arrays planos nativos de MySQL
const execute = async (db, sql, params = []) => {
  const [rows] = await db.execute(sql, params);
  return rows;
};

// Modificamos buildWhere para ir guardando los valores en un Array ordenado
const buildWhere = (filters = {}) => {
  const where = [];
  const params = []; // Ahora es un array plano

  if (filters.supplierId) {
    where.push('sp.supplier_id = ?');
    params.push(Number(filters.supplierId));
  }

  if (filters.supplyType) {
    where.push('sp.supply_type = ?');
    params.push(filters.supplyType);
  }

  if (filters.from) {
    where.push('sp.purchase_date >= ?');
    params.push(filters.from);
  }

  if (filters.to) {
    where.push('sp.purchase_date <= ?');
    params.push(filters.to);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const purchaseSelect = `
  SELECT
    sp.id,
    sp.supplier_id AS supplierId,
    s.name AS supplierName,
    sp.supply_type AS supplyType,
    sp.quantity,
    sp.unit_cost AS unitCost,
    sp.total_cost AS totalCost,
    sp.purchase_date AS purchaseDate,
    sp.observations,
    sp.created_at AS createdAt
  FROM supply_purchases sp
  JOIN suppliers s ON s.id = sp.supplier_id
`;

const findAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);

  return execute(
    db,
    `${purchaseSelect}
     ${whereSql}
     ORDER BY sp.purchase_date DESC, sp.id DESC
     ${paginationClause(filters, 10, 100)}`,
    params
  );
};

const countAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(
    db,
    `SELECT COUNT(*) AS total
     FROM supply_purchases sp
     ${whereSql}`,
    params // Ya es un array limpio gracias a buildWhere
  );

  return rows[0].total;
};

const findById = async (id, db = pool) => {
  const rows = await execute(
    db,
    `${purchaseSelect}
     WHERE sp.id = ?
     LIMIT 1`,
    [id] // Cambiado a array
  );

  if (!rows[0]) {
    return null;
  }

  const products = await execute(
    db,
    `SELECT
        ps.id,
        ps.product_id AS productId,
        p.name AS productName,
        ps.quantity_used AS quantityUsed
     FROM product_supplies ps
     JOIN products p ON p.id = ps.product_id
     WHERE ps.supply_purchase_id = ?
     ORDER BY p.name ASC`,
    [id] // Cambiado a array
  );

  return {
    ...rows[0],
    products
  };
};

const create = async (payload, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO supply_purchases (
        supplier_id,
        supply_type,
        quantity,
        unit_cost,
        total_cost,
        purchase_date,
        observations
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`, // Cambiado a marcadores '?'
    [
      payload.supplierId,
      payload.supplyType,
      payload.quantity,
      payload.unitCost,
      payload.totalCost,
      payload.purchaseDate,
      payload.observations || null
    ]
  );

  return result.insertId;
};

const update = async (id, payload, db = pool) => {
  await execute(
    db,
    `UPDATE supply_purchases
     SET
       supplier_id = ?,
       supply_type = ?,
       quantity = ?,
       unit_cost = ?,
       total_cost = ?,
       purchase_date = ?,
       observations = ?
     WHERE id = ?`, // Cambiado a marcadores '?'
    [
      payload.supplierId,
      payload.supplyType,
      payload.quantity,
      payload.unitCost,
      payload.totalCost,
      payload.purchaseDate,
      payload.observations || null,
      id // Al final porque el WHERE id está al final
    ]
  );
};

const replaceProductLinks = async (purchaseId, products, db = pool) => {
  await execute(db, 'DELETE FROM product_supplies WHERE supply_purchase_id = ?', [purchaseId]);

  for (const product of products) {
    await execute(
      db,
      `INSERT INTO product_supplies (product_id, supply_purchase_id, quantity_used)
       VALUES (?, ?, ?)`,
      [
        product.productId,
        purchaseId,
        product.quantityUsed
      ]
    );
  }
};

const createFinancialTransaction = async (payload, db = pool) => {
  await execute(
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
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.type,
      payload.category,
      payload.amount,
      payload.description,
      payload.referenceType,
      payload.referenceId,
      payload.transactionDate
    ]
  );
};

const syncFinancialTransaction = async (payload, db = pool) => {
  await execute(
    db,
    `UPDATE financial_transactions
     SET
       amount = ?,
       description = ?,
       transaction_date = ?
     WHERE reference_type = 'supply_purchase'
       AND reference_id = ?`,
    [
      payload.amount,
      payload.description,
      payload.transactionDate,
      payload.referenceId // Respetando que reference_id va de últimas en el WHERE
    ]
  );
};

const remove = async (id, db = pool) => {
  await execute(db, "DELETE FROM financial_transactions WHERE reference_type = 'supply_purchase' AND reference_id = ?", [id]);
  await execute(db, 'DELETE FROM product_supplies WHERE supply_purchase_id = ?', [id]);
  await execute(db, 'DELETE FROM supply_purchases WHERE id = ?', [id]);
};

const findMonthlyExpenses = async (filters = {}, db = pool) => {
  const params = [];
  const where = ["ft.type = 'expense'", "ft.category = 'supplies'"];

  if (filters.year) {
    where.push('YEAR(ft.transaction_date) = ?');
    params.push(Number(filters.year));
  }

  return execute(
    db,
    `SELECT
       DATE_FORMAT(ft.transaction_date, '%Y-%m') AS month,
       SUM(ft.amount) AS total
     FROM financial_transactions ft
     WHERE ${where.join(' AND ')}
     GROUP BY DATE_FORMAT(ft.transaction_date, '%Y-%m')
     ORDER BY month ASC`,
    params
  );
};

module.exports = {
  findAll,
  countAll,
  findById,
  create,
  update,
  replaceProductLinks,
  createFinancialTransaction,
  syncFinancialTransaction,
  remove,
  findMonthlyExpenses
};