const { body, param, query } = require('express-validator');

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Product id must be valid')
];

const list = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('categoryId').optional().isInt({ min: 1 }).withMessage('Category id must be valid'),
  query('groupId').optional().isInt({ min: 1 }).withMessage('Group id must be valid'),
  query('active').optional().isBoolean().withMessage('Active must be true or false'),
  query('lowStock').optional().isBoolean().withMessage('Low stock must be true or false')
];

const images = body('images')
  .optional()
  .isArray({ max: 8 })
  .withMessage('Images must be an array with up to 8 items');

const imageFields = [
  body('images.*.imageUrl')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Image URL must be valid'),
  body('images.*.isMain')
    .optional()
    .isBoolean()
    .withMessage('Image isMain must be true or false')
    .toBoolean()
];

const productBody = [
  body('groupId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Group id must be valid'),
  body('categoryId').isInt({ min: 1 }).withMessage('Category is required'),
  body('supplierId').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Supplier id must be valid'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 160 }),
  body('description').optional({ nullable: true }).isLength({ max: 2000 }),
  body('size').trim().notEmpty().withMessage('Size is required').isLength({ max: 30 }),
  body('color').trim().notEmpty().withMessage('Color is required').isLength({ max: 60 }),
  body('salePrice').isFloat({ min: 0 }).withMessage('Sale price must be greater than or equal to 0'),
  body('manufacturingCost').isFloat({ min: 0 }).withMessage('Manufacturing cost must be greater than or equal to 0'),
  body('minStock').isInt({ min: 0 }).withMessage('Minimum stock must be greater than or equal to 0')
];

const create = [
  ...productBody,
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be greater than or equal to 0'),
  body('active').optional().isBoolean().withMessage('Active must be true or false').toBoolean(),
  images,
  ...imageFields
];

const update = [
  ...idParam,
  ...productBody,
  images,
  ...imageFields
];

const updateStatus = [
  ...idParam,
  body('active').isBoolean().withMessage('Active must be true or false').toBoolean()
];

module.exports = {
  idParam,
  list,
  create,
  update,
  updateStatus
};
