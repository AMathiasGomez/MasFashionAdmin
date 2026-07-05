const customerService = require('./customer.service');
const { sendSuccess } = require('../../utils/api-response');

const listCustomers = async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  sendSuccess(res, result);
};

const getFrequentCustomers = async (req, res) => {
  const customers = await customerService.getFrequentCustomers(req.query);
  sendSuccess(res, customers);
};

const getCustomer = async (req, res) => {
  const customer = await customerService.getCustomerById(Number(req.params.id));
  sendSuccess(res, customer);
};

const createCustomer = async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  sendSuccess(res, customer, 'Customer created successfully', 201);
};

const updateCustomer = async (req, res) => {
  const customer = await customerService.updateCustomer(Number(req.params.id), req.body);
  sendSuccess(res, customer, 'Customer updated successfully');
};

const deleteCustomer = async (req, res) => {
  await customerService.deleteCustomer(Number(req.params.id));
  sendSuccess(res, null, 'Customer deleted successfully');
};

module.exports = {
  listCustomers,
  getFrequentCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

