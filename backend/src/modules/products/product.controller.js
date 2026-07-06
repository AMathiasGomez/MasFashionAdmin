const productService = require('./product.service');
const { sendSuccess } = require('../../utils/api-response');

const listProducts = async (req, res) => {
  const result = await productService.listProducts(req.query);
  sendSuccess(res, result);
};

const listGroupedProducts = async (req, res) => {
  const groups = await productService.listGroupedProducts(req.query);
  sendSuccess(res, groups);
};

const getProduct = async (req, res) => {
  const product = await productService.getProductById(Number(req.params.id));
  sendSuccess(res, product);
};

const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.body);
  sendSuccess(res, product, 'Product created successfully', 201);
};

const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(Number(req.params.id), req.body);
  sendSuccess(res, product, 'Product updated successfully');
};

const updateProductStatus = async (req, res) => {
  const product = await productService.updateProductStatus(Number(req.params.id), req.body.active);
  sendSuccess(res, product, 'Product status updated successfully');
};

const deleteProduct = async (req, res) => {
  const product = await productService.deleteProduct(Number(req.params.id));
  sendSuccess(res, product, 'Product disabled successfully');
};

module.exports = {
  listProducts,
  listGroupedProducts,
  getProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct
};

