const { param, query, body } = require('express-validator');

const reportTypes = ['inventory', 'orders', 'sales', 'profits', 'profitability'];

const exportReport = [
  param('type').isIn(reportTypes).withMessage('Report type is invalid'),
  param('format').isIn(['xlsx', 'pdf']).withMessage('Report format is invalid'),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

const emailReport = [
  param('type').isIn(reportTypes).withMessage('Report type is invalid'),
  param('format').isIn(['xlsx', 'pdf']).withMessage('Report format is invalid'),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid'),
  body('recipients').optional().isArray({ min: 1 }).withMessage('Recipients must be a non-empty array'),
  body('recipients.*').optional().isEmail().withMessage('Each recipient must be a valid email')
];

module.exports = {
  exportReport,
  emailReport
};

