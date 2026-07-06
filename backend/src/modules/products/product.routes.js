const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const { auditLogger } = require('../../middlewares/audit.middleware');
const productController = require('./product.controller');
const productValidator = require('./product.validator');

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('products.read'),
  productValidator.list,
  validateRequest,
  asyncHandler(productController.listProducts)
);

router.get(
  '/groups',
  authorizePermissions('products.read'),
  productValidator.list,
  validateRequest,
  asyncHandler(productController.listGroupedProducts)
);

router.get(
  '/:id',
  authorizePermissions('products.read'),
  productValidator.idParam,
  validateRequest,
  asyncHandler(productController.getProduct)
);

router.post(
  '/',
  authorizePermissions('products.manage'),
  productValidator.create,
  validateRequest,
  auditLogger('create', 'product'),
  asyncHandler(productController.createProduct)
);

router.put(
  '/:id',
  authorizePermissions('products.manage'),
  productValidator.update,
  validateRequest,
  auditLogger('update', 'product'),
  asyncHandler(productController.updateProduct)
);

router.patch(
  '/:id/status',
  authorizePermissions('products.manage'),
  productValidator.updateStatus,
  validateRequest,
  auditLogger('status_change', 'product'),
  asyncHandler(productController.updateProductStatus)
);

router.delete(
  '/:id',
  authorizePermissions('products.manage'),
  productValidator.idParam,
  validateRequest,
  auditLogger('delete', 'product'),
  asyncHandler(productController.deleteProduct)
);

module.exports = router;

