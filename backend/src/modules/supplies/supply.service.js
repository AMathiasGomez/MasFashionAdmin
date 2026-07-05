const supplyModel = require('./supply.model');
const { withTransaction } = require('../../config/database');
const { ApiError } = require('../../utils/api-error');

const listPurchases = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 10), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    supplyModel.findAll({ ...filters, limit, offset }),
    supplyModel.countAll(filters)
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

const getMonthlyExpenses = (filters) => supplyModel.findMonthlyExpenses(filters);

const getPurchaseById = async (id) => {
  const purchase = await supplyModel.findById(id);

  if (!purchase) {
    throw new ApiError(404, 'Supply purchase not found');
  }

  return purchase;
};

const createPurchase = async (payload) =>
  withTransaction(async (connection) => {
    const totalCost = Number(payload.quantity) * Number(payload.unitCost);
    const purchaseId = await supplyModel.create({ ...payload, totalCost }, connection);

    if (payload.products?.length) {
      await supplyModel.replaceProductLinks(purchaseId, payload.products, connection);
    }

    await supplyModel.createFinancialTransaction(
      {
        type: 'expense',
        category: 'supplies',
        amount: totalCost,
        description: `Supply purchase #${purchaseId}`,
        referenceType: 'supply_purchase',
        referenceId: purchaseId,
        transactionDate: payload.purchaseDate
      },
      connection
    );

    return supplyModel.findById(purchaseId, connection);
  });

const updatePurchase = async (id, payload) =>
  withTransaction(async (connection) => {
    const existing = await supplyModel.findById(id, connection);

    if (!existing) {
      throw new ApiError(404, 'Supply purchase not found');
    }

    const totalCost = Number(payload.quantity) * Number(payload.unitCost);
    await supplyModel.update(id, { ...payload, totalCost }, connection);
    await supplyModel.replaceProductLinks(id, payload.products || [], connection);
    await supplyModel.syncFinancialTransaction(
      {
        amount: totalCost,
        description: `Supply purchase #${id}`,
        transactionDate: payload.purchaseDate,
        referenceId: id
      },
      connection
    );

    return supplyModel.findById(id, connection);
  });

const deletePurchase = async (id) =>
  withTransaction(async (connection) => {
    const existing = await supplyModel.findById(id, connection);

    if (!existing) {
      throw new ApiError(404, 'Supply purchase not found');
    }

    await supplyModel.remove(id, connection);
  });

module.exports = {
  listPurchases,
  getMonthlyExpenses,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase
};

