const { body, param, query } = require('express-validator');

const statuses = ['pending', 'in_production', 'shipped', 'delivered', 'cancelled'];
const paymentMethods = ['cash', 'card', 'transfer', 'nequi', 'daviplata', 'other'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Order id must be valid')
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(statuses).withMessage('Order status is invalid'),
  query('customerId').optional().isInt({ min: 1 }).withMessage('Customer id must be valid'),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

const create = [
  body('customerId').isInt({ min: 1 }).withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must include at least one product'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Product id must be valid'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than 0'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be greater than or equal to 0'),
  body('status').optional().isIn(statuses).withMessage('Order status is invalid'),
  body('paymentMethod').isIn(paymentMethods).withMessage('Payment method is invalid'),
  body('deliveryAddress').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('observations').optional({ nullable: true }).trim().isLength({ max: 2000 }),
  body('amountPaid').optional().isFloat({ min: 0 }).withMessage('Amount paid must be greater than or equal to 0')
];

const updateStatus = [
  ...idParam,
  body('status').isIn(statuses).withMessage('Order status is invalid')
];

const addPayment = [
  ...idParam,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(paymentMethods).withMessage('Payment method is invalid'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 255 })
];

module.exports = {
  idParam,
  list,
  create,
  updateStatus,
  addPayment
};

