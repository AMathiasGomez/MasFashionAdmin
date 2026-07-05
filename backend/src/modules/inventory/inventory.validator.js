const { body, query } = require('express-validator');

const movementTypes = ['in', 'out', 'return', 'adjustment'];
const referenceTypes = ['order', 'manual', 'supply', 'correction'];

const listMovements = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('productId').optional().isInt({ min: 1 }).withMessage('Product id must be valid'),
  query('movementType').optional().isIn(movementTypes).withMessage('Movement type is invalid'),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

const createMovement = [
  body('productId').isInt({ min: 1 }).withMessage('Product id is required'),
  body('movementType').isIn(movementTypes).withMessage('Movement type is invalid'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be greater than 0'),
  body('reason').optional({ nullable: true }).isLength({ max: 255 }),
  body('referenceType').optional().isIn(referenceTypes).withMessage('Reference type is invalid'),
  body('referenceId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Reference id must be valid')
];

module.exports = {
  listMovements,
  createMovement
};

