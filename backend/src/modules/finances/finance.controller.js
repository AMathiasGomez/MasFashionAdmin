const financeService = require('./finance.service');
const { sendSuccess } = require('../../utils/api-response');

const getSummary = async (req, res) => {
  const summary = await financeService.getSummary(req.query);
  sendSuccess(res, summary);
};

const listTransactions = async (req, res) => {
  const result = await financeService.listTransactions(req.query);
  sendSuccess(res, result);
};

const createTransaction = async (req, res) => {
  const transaction = await financeService.createTransaction(req.body);
  sendSuccess(res, transaction, 'Financial transaction created successfully', 201);
};

const deleteTransaction = async (req, res) => {
  await financeService.deleteTransaction(Number(req.params.id));
  sendSuccess(res, null, 'Financial transaction deleted successfully');
};

module.exports = {
  getSummary,
  listTransactions,
  createTransaction,
  deleteTransaction
};

