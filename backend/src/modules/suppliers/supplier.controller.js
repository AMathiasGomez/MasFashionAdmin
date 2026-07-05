const supplierService = require('./supplier.service');
const { sendSuccess } = require('../../utils/api-response');

const listSuppliers = async (req, res) => {
  const result = await supplierService.listSuppliers(req.query);
  sendSuccess(res, result);
};

const getSupplier = async (req, res) => {
  const supplier = await supplierService.getSupplierById(Number(req.params.id));
  sendSuccess(res, supplier);
};

const createSupplier = async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  sendSuccess(res, supplier, 'Supplier created successfully', 201);
};

const updateSupplier = async (req, res) => {
  const supplier = await supplierService.updateSupplier(Number(req.params.id), req.body);
  sendSuccess(res, supplier, 'Supplier updated successfully');
};

const updateSupplierStatus = async (req, res) => {
  const supplier = await supplierService.updateSupplierStatus(Number(req.params.id), req.body.active);
  sendSuccess(res, supplier, 'Supplier status updated successfully');
};

const deleteSupplier = async (req, res) => {
  const supplier = await supplierService.deleteSupplier(Number(req.params.id));
  sendSuccess(res, supplier, 'Supplier disabled successfully');
};

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  deleteSupplier
};

