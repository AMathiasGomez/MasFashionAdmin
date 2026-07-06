const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const { auditLogger } = require('../../middlewares/audit.middleware');
const supplyController = require('./supply.controller');
const supplyValidator = require('./supply.validator');

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('supplies.read'),
  supplyValidator.list,
  validateRequest,
  asyncHandler(supplyController.listPurchases)
);

router.get(
  '/monthly-expenses',
  authorizePermissions('supplies.read'),
  supplyValidator.monthlyExpenses,
  validateRequest,
  asyncHandler(supplyController.getMonthlyExpenses)
);

router.get(
  '/:id',
  authorizePermissions('supplies.read'),
  supplyValidator.idParam,
  validateRequest,
  asyncHandler(supplyController.getPurchase)
);

router.post(
  '/',
  authorizePermissions('supplies.manage'),
  supplyValidator.create,
  validateRequest,
  auditLogger('create', 'supply_purchase'),
  asyncHandler(supplyController.createPurchase)
);

router.put(
  '/:id',
  authorizePermissions('supplies.manage'),
  supplyValidator.update,
  validateRequest,
  auditLogger('update', 'supply_purchase'),
  asyncHandler(supplyController.updatePurchase)
);

router.delete(
  '/:id',
  authorizePermissions('supplies.manage'),
  supplyValidator.idParam,
  validateRequest,
  auditLogger('delete', 'supply_purchase'),
  asyncHandler(supplyController.deletePurchase)
);

module.exports = router;

