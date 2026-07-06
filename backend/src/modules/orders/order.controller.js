const orderService = require('./order.service');
const { sendSuccess } = require('../../utils/api-response');

const listOrders = async (req, res) => {
  const result = await orderService.listOrders(req.query);
  sendSuccess(res, result);
};

const listReceivables = async (req, res) => {
  const receivables = await orderService.listReceivables();
  sendSuccess(res, receivables);
};

const getOrder = async (req, res) => {
  const order = await orderService.getOrderById(Number(req.params.id));
  sendSuccess(res, order);
};

const createOrder = async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user);
  sendSuccess(res, order, 'Order created successfully', 201);
};

const updateStatus = async (req, res) => {
  const order = await orderService.updateStatus(Number(req.params.id), req.body.status, req.user);
  sendSuccess(res, order, 'Order status updated successfully');
};

const addPayment = async (req, res) => {
  const order = await orderService.addPayment(Number(req.params.id), req.body, req.user);
  sendSuccess(res, order, 'Payment registered successfully', 201);
};

module.exports = {
  listOrders,
  listReceivables,
  getOrder,
  createOrder,
  updateStatus,
  addPayment
};
