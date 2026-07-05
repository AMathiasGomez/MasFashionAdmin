const { body, param, query } = require('express-validator');

const supplyTypes = ['fabric', 'buttons', 'zippers', 'labels', 'other'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Supply purchase id must be valid')
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('supplierId').optional().isInt({ min: 1 }).withMessage('Supplier id must be valid'),
  query('supplyType').optional().isIn(supplyTypes).withMessage('Supply type is invalid'),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

const monthlyExpenses = [
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid')
];

const productLinks = [
  body('products').optional().isArray().withMessage('Products must be an array'),
  body('products.*.productId').optional().isInt({ min: 1 }).withMessage('Product id must be valid'),
  body('products.*.quantityUsed').optional().isFloat({ min: 0.01 }).withMessage('Quantity used must be greater than 0')
];

const bodyRules = [
  body('supplierId').isInt({ min: 1 }).withMessage('Supplier is required'),
  body('supplyType').isIn(supplyTypes).withMessage('Supply type is invalid'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('unitCost').isFloat({ min: 0 }).withMessage('Unit cost must be greater than or equal to 0'),
  body('purchaseDate').isISO8601().withMessage('Purchase date must be valid'),
  body('observations').optional({ nullable: true }).trim().isLength({ max: 2000 }),
  ...productLinks
];

module.exports = {
  idParam,
  list,
  monthlyExpenses,
  create: bodyRules,
  update: [...idParam, ...bodyRules]
};

