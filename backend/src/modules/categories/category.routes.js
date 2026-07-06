const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const { auditLogger } = require('../../middlewares/audit.middleware');
const categoryController = require('./category.controller');
const categoryValidator = require('./category.validator');

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('categories.read'),
  categoryValidator.list,
  validateRequest,
  asyncHandler(categoryController.listCategories)
);

router.post(
  '/',
  authorizePermissions('categories.manage'),
  categoryValidator.create,
  validateRequest,
  auditLogger('create', 'category'),
  asyncHandler(categoryController.createCategory)
);

router.put(
  '/:id',
  authorizePermissions('categories.manage'),
  categoryValidator.update,
  validateRequest,
  auditLogger('update', 'category'),
  asyncHandler(categoryController.updateCategory)
);

router.delete(
  '/:id',
  authorizePermissions('categories.manage'),
  categoryValidator.idParam,
  validateRequest,
  auditLogger('delete', 'category'),
  asyncHandler(categoryController.deleteCategory)
);

module.exports = router;

