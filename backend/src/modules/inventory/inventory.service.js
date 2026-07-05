const inventoryModel = require('./inventory.model');
const { withTransaction } = require('../../config/database');
const { ApiError } = require('../../utils/api-error');

const getLowStockProducts = () => inventoryModel.findLowStockProducts();

const listMovements = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 20), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    inventoryModel.findMovements({ ...filters, limit, offset }),
    inventoryModel.countMovements(filters)
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

const createMovement = async (payload, user) =>
  withTransaction(async (connection) => {
    const product = await inventoryModel.findProductForUpdate(payload.productId, connection);

    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const quantity = Number(payload.quantity);
    const previousStock = Number(product.stock);
    let newStock = previousStock;

    if (payload.movementType === 'in' || payload.movementType === 'return') {
      newStock += quantity;
    }

    if (payload.movementType === 'out') {
      newStock -= quantity;
    }

    if (payload.movementType === 'adjustment') {
      newStock = quantity;
    }

    if (newStock < 0) {
      throw new ApiError(409, 'Insufficient stock for this movement');
    }

    await inventoryModel.updateProductStock(payload.productId, newStock, connection);

    const movementId = await inventoryModel.createMovement(
      {
        productId: payload.productId,
        userId: user.id,
        movementType: payload.movementType,
        quantity,
        previousStock,
        newStock,
        reason: payload.reason || null,
        referenceType: payload.referenceType || 'manual',
        referenceId: payload.referenceId || null
      },
      connection
    );

    return inventoryModel.findMovementById(movementId, connection);
  });

module.exports = {
  getLowStockProducts,
  listMovements,
  createMovement
};
