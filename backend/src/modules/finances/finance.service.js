const financeModel = require('./finance.model');
const { ApiError } = require('../../utils/api-error');

const getSummary = (filters) => financeModel.getSummary(filters);

const listTransactions = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 20), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    financeModel.findTransactions({ ...filters, limit, offset }),
    financeModel.countTransactions(filters)
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

const createTransaction = async (payload) => {
  const transactionId = await financeModel.createTransaction({
    ...payload,
    referenceType: 'manual',
    referenceId: null
  });

  return financeModel.findTransactionById(transactionId);
};

const deleteTransaction = async (id) => {
  const existing = await financeModel.findTransactionById(id);

  if (!existing) {
    throw new ApiError(404, 'Financial transaction not found');
  }

  if (existing.referenceType !== 'manual') {
    throw new ApiError(409, 'Only manual financial transactions can be deleted here');
  }

  await financeModel.removeTransaction(id);
};

module.exports = {
  getSummary,
  listTransactions,
  createTransaction,
  deleteTransaction
};

