const { body, param, query } = require('express-validator');

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Supplier id must be valid')
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('active').optional().isBoolean().withMessage('Active must be true or false')
];

const supplierBody = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 30 }),
  body('email').optional({ nullable: true }).trim().isEmail().withMessage('Email must be valid').isLength({ max: 160 }),
  body('address').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 })
];

const create = [
  ...supplierBody,
  body('active').optional().isBoolean().withMessage('Active must be true or false').toBoolean()
];

const updateStatus = [
  ...idParam,
  body('active').isBoolean().withMessage('Active must be true or false').toBoolean()
];

module.exports = {
  idParam,
  list,
  create,
  update: [...idParam, ...supplierBody],
  updateStatus
};

