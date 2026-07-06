const { query } = require('express-validator');

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('entityType').optional().trim().isLength({ max: 50 }),
  query('action').optional().trim().isLength({ max: 30 }),
  query('userId').optional().isInt({ min: 1 }).withMessage('User id must be valid'),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

module.exports = {
  list
};
