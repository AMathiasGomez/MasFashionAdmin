const { body, param, query } = require('express-validator');

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Customer id must be valid')
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const frequent = [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

const customerBody = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('instagram').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('address').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 })
];

module.exports = {
  idParam,
  list,
  frequent,
  create: customerBody,
  update: [...idParam, ...customerBody]
};

