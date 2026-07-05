const { pool } = require('../../config/database');

const execute = async (sql, params = {}) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const getCards = async (period) => {
  const rows = await execute(
    `SELECT
       COALESCE((
         SELECT SUM(total)
         FROM orders
         WHERE status != 'cancelled'
           AND DATE_FORMAT(created_at, '%Y-%m') = :period
       ), 0) AS monthSales,
       COALESCE((
         SELECT SUM(amount)
         FROM financial_transactions
         WHERE type = 'income'
           AND DATE_FORMAT(transaction_date, '%Y-%m') = :period
       ), 0) AS monthIncome,
       COALESCE((
         SELECT SUM(amount)
         FROM financial_transactions
         WHERE type = 'expense'
           AND DATE_FORMAT(transaction_date, '%Y-%m') = :period
       ), 0) AS monthExpenses,
       COALESCE((
         SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)
         FROM financial_transactions
         WHERE DATE_FORMAT(transaction_date, '%Y-%m') = :period
       ), 0) AS monthNetProfit,
       (
         SELECT COUNT(*)
         FROM orders
         WHERE status IN ('pending', 'in_production')
       ) AS pendingOrders,
       (
         SELECT COUNT(*)
         FROM products
         WHERE active = 1 AND stock <= min_stock
       ) AS lowStockProducts`,
    { period }
  );

  return rows[0];
};

const getMonthlySales = async (year) =>
  execute(
    `SELECT
       DATE_FORMAT(created_at, '%Y-%m') AS month,
       SUM(total) AS sales,
       COUNT(*) AS orders
     FROM orders
     WHERE status != 'cancelled'
       AND YEAR(created_at) = :year
     GROUP BY DATE_FORMAT(created_at, '%Y-%m')
     ORDER BY month ASC`,
    { year }
  );

const getBestSellingProducts = async (period) =>
  execute(
    `SELECT
       p.id,
       p.name,
       p.size,
       p.color,
       SUM(oi.quantity) AS unitsSold,
       SUM(oi.subtotal) AS salesTotal,
       SUM((oi.unit_price - oi.unit_cost) * oi.quantity) AS grossProfit
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.status != 'cancelled'
       AND DATE_FORMAT(o.created_at, '%Y-%m') = :period
     GROUP BY p.id, p.name, p.size, p.color
     ORDER BY unitsSold DESC, salesTotal DESC
     LIMIT 10`,
    { period }
  );

const getLowStockProducts = async () =>
  execute(
    `SELECT
       p.id,
       p.name,
       c.name AS categoryName,
       p.size,
       p.color,
       p.stock,
       p.min_stock AS minStock
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.active = 1 AND p.stock <= p.min_stock
     ORDER BY (p.min_stock - p.stock) DESC, p.name ASC
     LIMIT 10`
  );

const getFrequentCustomers = async () =>
  execute(
    `SELECT
       c.id,
       c.name,
       c.phone,
       c.instagram,
       COUNT(o.id) AS ordersCount,
       COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) AS totalSpent
     FROM customers c
     JOIN orders o ON o.customer_id = c.id
     GROUP BY c.id, c.name, c.phone, c.instagram
     ORDER BY ordersCount DESC, totalSpent DESC
     LIMIT 10`
  );

const getPendingOrders = async () =>
  execute(
    `SELECT
       o.id,
       c.name AS customerName,
       o.total,
       o.status,
       o.created_at AS createdAt
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     WHERE o.status IN ('pending', 'in_production')
     ORDER BY o.created_at ASC
     LIMIT 10`
  );

module.exports = {
  getCards,
  getMonthlySales,
  getBestSellingProducts,
  getLowStockProducts,
  getFrequentCustomers,
  getPendingOrders
};

