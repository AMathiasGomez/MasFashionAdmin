const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const financeController = require('./finance.controller');
const financeValidator = require('./finance.validator');

router.use(authenticate);

router.get(
  '/summary',
  authorizePermissions('finances.read'),
  financeValidator.summary,
  validateRequest,
  asyncHandler(financeController.getSummary)
);

router.get(
  '/transactions',
  authorizePermissions('finances.read'),
  financeValidator.list,
  validateRequest,
  asyncHandler(financeController.listTransactions)
);

router.post(
  '/transactions',
  authorizePermissions('finances.manage'),
  financeValidator.create,
  validateRequest,
  asyncHandler(financeController.createTransaction)
);

router.delete(
  '/transactions/:id',
  authorizePermissions('finances.manage'),
  financeValidator.idParam,
  validateRequest,
  asyncHandler(financeController.deleteTransaction)
);

module.exports = router;

