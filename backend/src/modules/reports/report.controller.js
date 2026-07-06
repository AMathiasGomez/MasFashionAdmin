const reportService = require('./report.service');
const { sendSuccess } = require('../../utils/api-response');

const exportReport = async (req, res) => {
  const { type, format } = req.params;
  const report = await reportService.exportReport(type, format, req.query);

  res.setHeader('Content-Type', report.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  res.send(report.buffer);
};

const emailReport = async (req, res) => {
  const { type, format } = req.params;
  const result = await reportService.emailReport(type, format, req.query, req.body.recipients);
  sendSuccess(res, result, 'Report emailed successfully');
};

module.exports = {
  exportReport,
  emailReport
};

