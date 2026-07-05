const { body, param, query } = require('express-validator');

const transactionTypes = ['income', 'expense'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Transaction id must be valid')
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(transactionTypes).withMessage('Transaction type is invalid'),
  query('category').optional().trim().isLength({ max: 80 }),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

const summary = [
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

const create = [
  body('type').isIn(transactionTypes).withMessage('Transaction type is invalid'),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 80 }),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('transactionDate').isISO8601().withMessage('Transaction date must be valid')
];

module.exports = {
  idParam,
  list,
  summary,
  create
};

