const supplyService = require('./supply.service');
const { sendSuccess } = require('../../utils/api-response');

const listPurchases = async (req, res) => {
  const result = await supplyService.listPurchases(req.query);
  sendSuccess(res, result);
};

const getMonthlyExpenses = async (req, res) => {
  const result = await supplyService.getMonthlyExpenses(req.query);
  sendSuccess(res, result);
};

const getPurchase = async (req, res) => {
  const purchase = await supplyService.getPurchaseById(Number(req.params.id));
  sendSuccess(res, purchase);
};

const createPurchase = async (req, res) => {
  const purchase = await supplyService.createPurchase(req.body);
  sendSuccess(res, purchase, 'Supply purchase created successfully', 201);
};

const updatePurchase = async (req, res) => {
  const purchase = await supplyService.updatePurchase(Number(req.params.id), req.body);
  sendSuccess(res, purchase, 'Supply purchase updated successfully');
};

const deletePurchase = async (req, res) => {
  await supplyService.deletePurchase(Number(req.params.id));
  sendSuccess(res, null, 'Supply purchase deleted successfully');
};

module.exports = {
  listPurchases,
  getMonthlyExpenses,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase
};

