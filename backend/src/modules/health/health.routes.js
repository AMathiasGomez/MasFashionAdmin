const router = require('express').Router();
const asyncHandler = require('../../middlewares/async-handler.middleware');
const healthController = require('./health.controller');

router.get('/', asyncHandler(healthController.getHealth));

module.exports = router;

