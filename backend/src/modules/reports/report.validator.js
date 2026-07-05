const { param, query } = require('express-validator');

const exportReport = [
  param('type')
    .isIn(['inventory', 'orders', 'sales', 'profits'])
    .withMessage('Report type is invalid'),
  param('format').isIn(['xlsx', 'pdf']).withMessage('Report format is invalid'),
  query('from').optional().isISO8601().withMessage('From date must be valid'),
  query('to').optional().isISO8601().withMessage('To date must be valid')
];

module.exports = {
  exportReport
};

