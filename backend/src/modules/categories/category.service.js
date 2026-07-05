const categoryModel = require('./category.model');
const { ApiError } = require('../../utils/api-error');

const listCategories = (filters) => categoryModel.findAll(filters);

const createCategory = async (payload) => {
  const categoryId = await categoryModel.create(payload);
  return categoryModel.findById(categoryId);
};

const updateCategory = async (id, payload) => {
  const existing = await categoryModel.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }

  await categoryModel.update(id, payload);
  return categoryModel.findById(id);
};

const deleteCategory = async (id) => {
  const existing = await categoryModel.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }

  await categoryModel.updateStatus(id, false);
  return categoryModel.findById(id);
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

