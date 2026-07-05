const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const supplierController = require('./supplier.controller');
const supplierValidator = require('./supplier.validator');

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('suppliers.read'),
  supplierValidator.list,
  validateRequest,
  asyncHandler(supplierController.listSuppliers)
);

router.get(
  '/:id',
  authorizePermissions('suppliers.read'),
  supplierValidator.idParam,
  validateRequest,
  asyncHandler(supplierController.getSupplier)
);

router.post(
  '/',
  authorizePermissions('suppliers.manage'),
  supplierValidator.create,
  validateRequest,
  asyncHandler(supplierController.createSupplier)
);

router.put(
  '/:id',
  authorizePermissions('suppliers.manage'),
  supplierValidator.update,
  validateRequest,
  asyncHandler(supplierController.updateSupplier)
);

router.patch(
  '/:id/status',
  authorizePermissions('suppliers.manage'),
  supplierValidator.updateStatus,
  validateRequest,
  asyncHandler(supplierController.updateSupplierStatus)
);

router.delete(
  '/:id',
  authorizePermissions('suppliers.manage'),
  supplierValidator.idParam,
  validateRequest,
  asyncHandler(supplierController.deleteSupplier)
);

module.exports = router;

