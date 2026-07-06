const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const { auditLogger } = require('../../middlewares/audit.middleware');
const customerController = require('./customer.controller');
const customerValidator = require('./customer.validator');

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('customers.read'),
  customerValidator.list,
  validateRequest,
  asyncHandler(customerController.listCustomers)
);

router.get(
  '/frequent',
  authorizePermissions('customers.read'),
  customerValidator.frequent,
  validateRequest,
  asyncHandler(customerController.getFrequentCustomers)
);

router.get(
  '/:id',
  authorizePermissions('customers.read'),
  customerValidator.idParam,
  validateRequest,
  asyncHandler(customerController.getCustomer)
);

router.post(
  '/',
  authorizePermissions('customers.manage'),
  customerValidator.create,
  validateRequest,
  auditLogger('create', 'customer'),
  asyncHandler(customerController.createCustomer)
);

router.put(
  '/:id',
  authorizePermissions('customers.manage'),
  customerValidator.update,
  validateRequest,
  auditLogger('update', 'customer'),
  asyncHandler(customerController.updateCustomer)
);

router.delete(
  '/:id',
  authorizePermissions('customers.manage'),
  customerValidator.idParam,
  validateRequest,
  auditLogger('delete', 'customer'),
  asyncHandler(customerController.deleteCustomer)
);

module.exports = router;

