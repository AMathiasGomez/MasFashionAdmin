const { query } = require('../../config/database');

// CLAVE: Modificamos para usar un Array ordenado y marcadores nativos '?'
const buildDateWhere = (alias, filters = {}) => {
  const where = [];
  const params = []; // Ahora es un array plano

  if (filters.from) {
    where.push(`DATE(${alias}) >= ?`);
    params.push(filters.from);
  }

  if (filters.to) {
    where.push(`DATE(${alias}) <= ?`);
    params.push(filters.to);
  }

  return {
    whereSql: where.length ? `AND ${where.join(' AND ')}` : '',
    params // Retorna el array ordenado listo para MySQL
  };
};

const getInventory = async () =>
  query(
    `SELECT
       p.name,
       c.name AS categoryName,
       COALESCE(s.name, '-') AS supplierName,
       p.size,
       p.color,
       p.sale_price AS salePrice,
       p.manufacturing_cost AS manufacturingCost,
       (p.sale_price - p.manufacturing_cost) AS profit,
       CASE
         WHEN p.sale_price = 0 THEN 0
         ELSE ROUND(((p.sale_price - p.manufacturing_cost) / p.sale_price) * 100, 2)
       END AS profitMargin,
       p.stock,
       p.min_stock AS minStock
     FROM products p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     ORDER BY p.name ASC`
  );

const getOrders = async (filters = {}) => {
  const { whereSql, params } = buildDateWhere('o.created_at', filters);

  return query(
    `SELECT
       o.id,
       c.name AS customerName,
       u.name AS userName,
       o.subtotal,
       o.discount,
       o.total,
       COALESCE(SUM(op.amount), 0) AS amountPaid,
       (o.total - COALESCE(SUM(op.amount), 0)) AS pendingAmount,
       o.status,
       o.payment_method AS paymentMethod,
       o.created_at AS createdAt
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_payments op ON op.order_id = o.id
     WHERE 1 = 1
       ${whereSql}
     GROUP BY o.id, c.name, u.name, o.subtotal, o.discount, o.total, o.status, o.payment_method, o.created_at
     ORDER BY o.created_at DESC`,
    params // Ya es el array ordenado generado por buildDateWhere
  );
};

const getSales = async (filters = {}) => {
  const { whereSql, params } = buildDateWhere('o.created_at', filters);

  return query(
    `SELECT
       DATE_FORMAT(o.created_at, '%Y-%m') AS month,
       COUNT(DISTINCT o.id) AS ordersCount,
       SUM(oi.quantity) AS unitsSold,
       SUM(oi.subtotal) AS salesTotal,
       SUM((oi.unit_price - oi.unit_cost) * oi.quantity) AS grossProfit
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.status != 'cancelled'
       ${whereSql}
     GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
     ORDER BY month ASC`,
    params // Pasamos el array ordenado
  );
};

const getProfits = async (filters = {}) => {
  const { whereSql, params } = buildDateWhere('o.created_at', filters);

  return query(
    `SELECT
       p.name AS productName,
       p.size,
       p.color,
       SUM(oi.quantity) AS unitsSold,
       SUM(oi.subtotal) AS salesTotal,
       SUM(oi.unit_cost * oi.quantity) AS costTotal,
       SUM((oi.unit_price - oi.unit_cost) * oi.quantity) AS grossProfit
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.status != 'cancelled'
       ${whereSql}
     GROUP BY p.id, p.name, p.size, p.color
     ORDER BY grossProfit DESC`,
    params // Pasamos el array ordenado
  );
};

module.exports = {
  getInventory,
  getOrders,
  getSales,
  getProfits
};