const auditService = require('./audit.service');
const { sendSuccess } = require('../../utils/api-response');

const listAuditLogs = async (req, res) => {
  const result = await auditService.listAuditLogs(req.query);
  sendSuccess(res, result);
};

module.exports = {
  listAuditLogs
};
