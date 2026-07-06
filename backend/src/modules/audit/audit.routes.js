const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const { authorizePermissions } = require('../../middlewares/role.middleware');
const auditController = require('./audit.controller');
const auditValidator = require('./audit.validator');

router.use(authenticate);

router.get(
  '/',
  authorizePermissions('audit.read'),
  auditValidator.list,
  validateRequest,
  asyncHandler(auditController.listAuditLogs)
);

module.exports = router;
