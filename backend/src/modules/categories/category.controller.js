const categoryService = require('./category.service');
const { sendSuccess } = require('../../utils/api-response');

const listCategories = async (req, res) => {
  const categories = await categoryService.listCategories(req.query);
  sendSuccess(res, categories);
};

const createCategory = async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendSuccess(res, category, 'Category created successfully', 201);
};

const updateCategory = async (req, res) => {
  const category = await categoryService.updateCategory(Number(req.params.id), req.body);
  sendSuccess(res, category, 'Category updated successfully');
};

const deleteCategory = async (req, res) => {
  const category = await categoryService.deleteCategory(Number(req.params.id));
  sendSuccess(res, category, 'Category disabled successfully');
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

