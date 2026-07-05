const router = require('express').Router();

const authenticate = require('../../middlewares/auth.middleware');
const asyncHandler = require('../../middlewares/async-handler.middleware');
const validateRequest = require('../../middlewares/validate.middleware');
const authController = require('./auth.controller');
const authValidator = require('./auth.validator');

router.post('/login', authValidator.login, validateRequest, asyncHandler(authController.login));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getProfile));

module.exports = router;

