const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const reportController = require('./report.controller');
const reportValidator = require('./report.validator');

router.use(authenticate);

router.get(
  '/:type/:format',
  authorizePermissions('reports.export'),
  reportValidator.exportReport,
  validateRequest,
  asyncHandler(reportController.exportReport)
);

module.exports = router;

