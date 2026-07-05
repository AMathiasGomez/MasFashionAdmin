const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const dashboardController = require('./dashboard.controller');
const dashboardValidator = require('./dashboard.validator');

router.use(authenticate);

router.get(
  '/summary',
  authorizePermissions('dashboard.read'),
  dashboardValidator.summary,
  validateRequest,
  asyncHandler(dashboardController.getSummary)
);

module.exports = router;

