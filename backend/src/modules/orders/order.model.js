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

  if (filters.status) {
    where.push('o.status = ?');
    params.push(filters.status);
  }

  if (filters.customerId) {
    where.push('o.customer_id = ?');
    params.push(Number(filters.customerId));
  }

  if (filters.from) {
    where.push('DATE(o.created_at) >= ?');
    params.push(filters.from);
  }

  if (filters.to) {
    where.push('DATE(o.created_at) <= ?');
    params.push(filters.to);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const orderSummarySelect = `
  SELECT
    o.id,
    o.customer_id AS customerId,
    c.name AS customerName,
    c.phone AS customerPhone,
    o.user_id AS userId,
    u.name AS userName,
    o.subtotal,
    o.discount,
    o.total,
    COALESCE(SUM(op.amount), 0) AS amountPaid,
    (o.total - COALESCE(SUM(op.amount), 0)) AS pendingAmount,
    o.status,
    o.payment_method AS paymentMethod,
    o.delivery_address AS deliveryAddress,
    o.observations,
    o.due_date AS dueDate,
    o.created_at AS createdAt,
    o.updated_at AS updatedAt
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  JOIN users u ON u.id = o.user_id
  LEFT JOIN order_payments op ON op.order_id = o.id
`;

const orderSummaryGroup = `
  GROUP BY
    o.id,
    o.customer_id,
    c.name,
    c.phone,
    o.user_id,
    u.name,
    o.subtotal,
    o.discount,
    o.total,
    o.status,
    o.payment_method,
    o.delivery_address,
    o.observations,
    o.due_date,
    o.created_at,
    o.updated_at
`;

const findAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);

  return execute(
    db,
    `${orderSummarySelect}
     ${whereSql}
     ${orderSummaryGroup}
     ORDER BY o.created_at DESC
     ${paginationClause(filters, 10, 100)}`,
    params
  );
};

const countAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(
    db,
    `SELECT COUNT(*) AS total
     FROM orders o
     ${whereSql}`,
    params // Ya es un array limpio gracias a buildWhere
  );

  return rows[0].total;
};

const findById = async (id, db = pool) => {
  const rows = await execute(
    db,
    `${orderSummarySelect}
     WHERE o.id = ?
     ${orderSummaryGroup}
     LIMIT 1`,
    [id]
  );

  if (!rows[0]) {
    return null;
  }

  const items = await execute(
    db,
    `SELECT
        oi.id,
        oi.product_id AS productId,
        p.name AS productName,
        p.size,
        p.color,
        oi.quantity,
        oi.unit_price AS unitPrice,
        oi.unit_cost AS unitCost,
        oi.subtotal,
        ((oi.unit_price - oi.unit_cost) * oi.quantity) AS profit
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [id]
  );

  const payments = await execute(
    db,
    `SELECT
        op.id,
        op.user_id AS userId,
        u.name AS userName,
        op.amount,
        op.payment_method AS paymentMethod,
        op.notes,
        op.paid_at AS paidAt
     FROM order_payments op
     JOIN users u ON u.id = op.user_id
     WHERE op.order_id = ?
     ORDER BY op.paid_at DESC`,
    [id]
  );

  return {
    ...rows[0],
    items,
    payments
  };
};

const findCustomerById = async (id, db = pool) => {
  const rows = await execute(
    db,
    `SELECT id, name, address
     FROM customers
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findProductForUpdate = async (id, db = pool) => {
  const rows = await execute(
    db,
    `SELECT id, name, sale_price, manufacturing_cost, stock
     FROM products
     WHERE id = ? AND active = 1
     FOR UPDATE`,
    [id]
  );

  return rows[0] || null;
};

const createOrder = async (payload, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO orders (
        customer_id,
        user_id,
        subtotal,
        discount,
        total,
        status,
        payment_method,
        delivery_address,
        observations,
        due_date
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.customerId,
      payload.userId,
      payload.subtotal,
      payload.discount,
      payload.total,
      payload.status,
      payload.paymentMethod,
      payload.deliveryAddress,
      payload.observations,
      payload.dueDate || null
    ]
  );

  return result.insertId;
};

const createOrderItem = async (payload, db = pool) => {
  await execute(
    db,
    `INSERT INTO order_items (
        order_id,
        product_id,
        quantity,
        unit_price,
        unit_cost,
        subtotal
     )
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      payload.orderId,
      payload.productId,
      payload.quantity,
      payload.unitPrice,
      payload.unitCost,
      payload.subtotal
    ]
  );
};

const updateProductStock = async (productId, stock, db = pool) => {
  await execute(
    db,
    `UPDATE products
     SET stock = ?
     WHERE id = ?`,
    [stock, productId] // Mismo orden posicional que en el SQL
  );
};

const createInventoryMovement = async (payload, db = pool) => {
  await execute(
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
};

const createPayment = async (payload, db = pool) => {
  await execute(
    db,
    `INSERT INTO order_payments (order_id, user_id, amount, payment_method, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.orderId,
      payload.userId,
      payload.amount,
      payload.paymentMethod,
      payload.notes
    ]
  );
};

const updateStatus = async (id, status, db = pool) => {
  await execute(
    db,
    `UPDATE orders
     SET status = ?
     WHERE id = ?`,
    [status, id] // status es el primer '?', id es el segundo '?'
  );
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
      payload.transactionDate.toISOString().slice(0, 10)
    ]
  );
};

const findReceivables = async (db = pool) =>
  execute(
    db,
    `${orderSummarySelect}
     WHERE o.status != 'cancelled'
     ${orderSummaryGroup}
     HAVING pendingAmount > 0
     ORDER BY (o.due_date IS NULL) ASC, o.due_date ASC, o.created_at ASC
     LIMIT 100`,
    []
  );

module.exports = {
  findAll,
  countAll,
  findById,
  findReceivables,
  findCustomerById,
  findProductForUpdate,
  createOrder,
  createOrderItem,
  updateProductStock,
  createInventoryMovement,
  createPayment,
  updateStatus,
  createFinancialTransaction
};