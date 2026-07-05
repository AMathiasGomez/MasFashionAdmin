const inventoryService = require('./inventory.service');
const { sendSuccess } = require('../../utils/api-response');

const getLowStockProducts = async (req, res) => {
  const products = await inventoryService.getLowStockProducts();
  sendSuccess(res, products);
};

const listMovements = async (req, res) => {
  const result = await inventoryService.listMovements(req.query);
  sendSuccess(res, result);
};

const createMovement = async (req, res) => {
  const movement = await inventoryService.createMovement(req.body, req.user);
  sendSuccess(res, movement, 'Inventory movement registered successfully', 201);
};

module.exports = {
  getLowStockProducts,
  listMovements,
  createMovement
};

