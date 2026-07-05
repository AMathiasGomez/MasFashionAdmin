const router = require('express').Router();

const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const financeRoutes = require('./modules/finances/finance.routes');
const healthRoutes = require('./modules/health/health.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const orderRoutes = require('./modules/orders/order.routes');
const productRoutes = require('./modules/products/product.routes');
const reportRoutes = require('./modules/reports/report.routes');
const supplyRoutes = require('./modules/supplies/supply.routes');
const supplierRoutes = require('./modules/suppliers/supplier.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportRoutes);
router.use('/supplies', supplyRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/finances', financeRoutes);

module.exports = router;
