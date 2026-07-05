const { body, param, query } = require('express-validator');

const list = [
  query('active').optional().isBoolean().withMessage('Active must be true or false')
];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Category id must be valid')
];

const bodyRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('active').optional().isBoolean().withMessage('Active must be true or false').toBoolean()
];

const update = [
  param('id').isInt({ min: 1 }).withMessage('Category id must be valid'),
  ...bodyRules
];

module.exports = {
  idParam,
  list,
  create: bodyRules,
  update
};

