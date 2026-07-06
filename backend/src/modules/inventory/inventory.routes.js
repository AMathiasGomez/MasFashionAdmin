const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const { auditLogger } = require('../../middlewares/audit.middleware');
const inventoryController = require('./inventory.controller');
const inventoryValidator = require('./inventory.validator');

router.use(authenticate);

router.get(
  '/low-stock',
  authorizePermissions('inventory.read'),
  asyncHandler(inventoryController.getLowStockProducts)
);

router.get(
  '/movements',
  authorizePermissions('inventory.read'),
  inventoryValidator.listMovements,
  validateRequest,
  asyncHandler(inventoryController.listMovements)
);

router.post(
  '/movements',
  authorizePermissions('inventory.manage'),
  inventoryValidator.createMovement,
  validateRequest,
  auditLogger('create', 'inventory_movement'),
  asyncHandler(inventoryController.createMovement)
);

module.exports = router;

