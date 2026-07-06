const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/api-response');

const getSummary = async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);
  sendSuccess(res, summary);
};

const getSalesForecast = async (req, res) => {
  const forecast = await dashboardService.getSalesForecast();
  sendSuccess(res, forecast);
};

module.exports = {
  getSummary,
  getSalesForecast
};

