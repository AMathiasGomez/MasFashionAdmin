const productModel = require('./product.model');
const { withTransaction } = require('../../config/database');
const { ApiError } = require('../../utils/api-error');

const listProducts = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 10), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    productModel.findAll({ ...filters, limit, offset }),
    productModel.countAll(filters)
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

const getProductById = async (id) => {
  const product = await productModel.findById(id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

const createProduct = async (payload) =>
  withTransaction(async (connection) => {
    const productId = await productModel.create(payload, connection);

    if (payload.images?.length) {
      await productModel.replaceImages(productId, payload.images, connection);
    }

    return productModel.findById(productId, connection);
  });

const updateProduct = async (id, payload) =>
  withTransaction(async (connection) => {
    const existing = await productModel.findById(id, connection);

    if (!existing) {
      throw new ApiError(404, 'Product not found');
    }

    await productModel.update(id, payload, connection);

    if (payload.images) {
      await productModel.replaceImages(id, payload.images, connection);
    }

    return productModel.findById(id, connection);
  });

const updateProductStatus = async (id, active) => {
  const existing = await productModel.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Product not found');
  }

  await productModel.updateStatus(id, active);
  return productModel.findById(id);
};

const deleteProduct = async (id) => updateProductStatus(id, false);

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
};

