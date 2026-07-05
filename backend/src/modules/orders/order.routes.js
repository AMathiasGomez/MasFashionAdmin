const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const orderController = require('./order.controller');
const orderValidator = require('./order.validator');

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('orders.read'),
  orderValidator.list,
  validateRequest,
  asyncHandler(orderController.listOrders)
);

router.get(
  '/:id',
  authorizePermissions('orders.read'),
  orderValidator.idParam,
  validateRequest,
  asyncHandler(orderController.getOrder)
);

router.post(
  '/',
  authorizePermissions('orders.manage'),
  orderValidator.create,
  validateRequest,
  asyncHandler(orderController.createOrder)
);

router.patch(
  '/:id/status',
  authorizePermissions('orders.manage'),
  orderValidator.updateStatus,
  validateRequest,
  asyncHandler(orderController.updateStatus)
);

router.post(
  '/:id/payments',
  authorizePermissions('orders.manage'),
  orderValidator.addPayment,
  validateRequest,
  asyncHandler(orderController.addPayment)
);

module.exports = router;

