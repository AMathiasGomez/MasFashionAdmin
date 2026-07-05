const supplierModel = require('./supplier.model');
const { ApiError } = require('../../utils/api-error');

const listSuppliers = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 10), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    supplierModel.findAll({ ...filters, limit, offset }),
    supplierModel.countAll(filters)
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

const getSupplierById = async (id) => {
  const supplier = await supplierModel.findById(id);

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  return supplier;
};

const createSupplier = async (payload) => {
  const supplierId = await supplierModel.create(payload);
  return getSupplierById(supplierId);
};

const updateSupplier = async (id, payload) => {
  const existing = await supplierModel.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Supplier not found');
  }

  await supplierModel.update(id, payload);
  return getSupplierById(id);
};

const updateSupplierStatus = async (id, active) => {
  const existing = await supplierModel.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Supplier not found');
  }

  await supplierModel.updateStatus(id, active);
  return getSupplierById(id);
};

const deleteSupplier = async (id) => updateSupplierStatus(id, false);

module.exports = {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  deleteSupplier
};

