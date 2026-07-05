const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/api-response');

const getSummary = async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);
  sendSuccess(res, summary);
};

module.exports = {
  getSummary
};

