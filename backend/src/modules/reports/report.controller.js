const reportService = require('./report.service');

const exportReport = async (req, res) => {
  const { type, format } = req.params;
  const report = await reportService.exportReport(type, format, req.query);

  res.setHeader('Content-Type', report.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  res.send(report.buffer);
};

module.exports = {
  exportReport
};

