const customerModel = require('./customer.model');
const { ApiError } = require('../../utils/api-error');

const listCustomers = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 10), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    customerModel.findAll({ ...filters, limit, offset }),
    customerModel.countAll(filters)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getFrequentCustomers = (filters) =>
  customerModel.findFrequentCustomers({
    limit: Math.min(Number(filters.limit || 10), 50)
  });

const getCustomerById = async (id) => {
  const customer = await customerModel.findById(id);

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return customer;
};

const createCustomer = async (payload) => {
  const customerId = await customerModel.create(payload);
  return getCustomerById(customerId);
};

const updateCustomer = async (id, payload) => {
  const existing = await customerModel.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Customer not found');
  }

  await customerModel.update(id, payload);
  return getCustomerById(id);
};

const deleteCustomer = async (id) => {
  const existing = await customerModel.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Customer not found');
  }

  if (Number(existing.ordersCount) > 0) {
    throw new ApiError(409, 'Customer has orders and cannot be deleted');
  }

  await customerModel.remove(id);
};

module.exports = {
  listCustomers,
  getFrequentCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

