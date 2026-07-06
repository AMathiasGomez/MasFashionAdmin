const { pool } = require('../../config/database');
const { paginationClause } = require('../../utils/sql-pagination');

const productFields = `
  p.id,
  p.group_id AS groupId,
  pg.name AS groupName,
  p.category_id AS categoryId,
  c.name AS categoryName,
  p.supplier_id AS supplierId,
  s.name AS supplierName,
  p.name,
  p.description,
  p.size,
  p.color,
  p.sale_price AS salePrice,
  p.manufacturing_cost AS manufacturingCost,
  (p.sale_price - p.manufacturing_cost) AS profit,
  CASE
    WHEN p.sale_price = 0 THEN 0
    ELSE ROUND(((p.sale_price - p.manufacturing_cost) / p.sale_price) * 100, 2)
  END AS profitMargin,
  p.stock,
  p.min_stock AS minStock,
  CASE WHEN p.stock <= p.min_stock THEN 1 ELSE 0 END AS isLowStock,
  p.active,
  p.created_at AS createdAt,
  p.updated_at AS updatedAt
`;

const baseSelect = `
  SELECT ${productFields}
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
  LEFT JOIN product_groups pg ON pg.id = p.group_id
`;

const execute = async (db, sql, params = {}) => {
  const [rows] = await db.execute(sql, params);
  return rows;
};

const buildWhere = (filters = {}) => {
  const where = [];
  const params = {};

  if (filters.search) {
    where.push('(p.name LIKE :search OR p.description LIKE :search OR p.color LIKE :search)');
    params.search = `%${filters.search}%`;
  }

  if (filters.categoryId) {
    where.push('p.category_id = :categoryId');
    params.categoryId = Number(filters.categoryId);
  }

  if (filters.groupId) {
    where.push('p.group_id = :groupId');
    params.groupId = Number(filters.groupId);
  }

  if (filters.active !== undefined) {
    where.push('p.active = :active');
    params.active = filters.active === 'true' || filters.active === true ? 1 : 0;
  }

  if (filters.lowStock === 'true' || filters.lowStock === true) {
    where.push('p.stock <= p.min_stock');
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
};

const findAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);

  return execute(
    db,
    `${baseSelect}
     ${whereSql}
     ORDER BY p.created_at DESC
     ${paginationClause(filters, 10, 100)}`,
    params
  );
};

const countAll = async (filters = {}, db = pool) => {
  const { whereSql, params } = buildWhere(filters);
  const rows = await execute(
    db,
    `SELECT COUNT(*) AS total
     FROM products p
     ${whereSql}`,
    params
  );

  return rows[0].total;
};

const findById = async (id, db = pool) => {
  const rows = await execute(
    db,
    `${baseSelect}
     WHERE p.id = :id
     LIMIT 1`,
    { id }
  );

  if (!rows[0]) {
    return null;
  }

  const images = await execute(
    db,
    `SELECT id, image_url AS imageUrl, is_main AS isMain, created_at AS createdAt
     FROM product_images
     WHERE product_id = :id
     ORDER BY is_main DESC, id ASC`,
    { id }
  );

  return {
    ...rows[0],
    images
  };
};

const findGroupByNameAndCategory = async (name, categoryId, db = pool) => {
  const rows = await execute(
    db,
    `SELECT id FROM product_groups WHERE name = :name AND category_id = :categoryId LIMIT 1`,
    { name, categoryId }
  );

  return rows[0] || null;
};

const createGroup = async ({ name, categoryId, supplierId, description }, db = pool) => {
  const result = await execute(
    db,
    `INSERT INTO product_groups (category_id, supplier_id, name, description)
     VALUES (:categoryId, :supplierId, :name, :description)`,
    { categoryId, supplierId: supplierId || null, name, description: description || null }
  );

  return result.insertId;
};

const findOrCreateGroup = async ({ name, categoryId, supplierId, description }, db = pool) => {
  const existing = await findGroupByNameAndCategory(name, categoryId, db);

  if (existing) {
    return existing.id;
  }

  return createGroup({ name, categoryId, supplierId, description }, db);
};

const create = async (payload, db = pool) => {
  const groupId =
    payload.groupId ||
    (await findOrCreateGroup(
      {
        name: payload.name,
        categoryId: payload.categoryId,
        supplierId: payload.supplierId,
        description: payload.description
      },
      db
    ));

  const result = await execute(
    db,
    `INSERT INTO products (
       group_id,
       category_id,
       supplier_id,
       name,
       description,
       size,
       color,
       sale_price,
       manufacturing_cost,
       stock,
       min_stock,
       active
     )
     VALUES (
       :groupId,
       :categoryId,
       :supplierId,
       :name,
       :description,
       :size,
       :color,
       :salePrice,
       :manufacturingCost,
       :stock,
       :minStock,
       :active
     )`,
    {
      groupId,
      categoryId: payload.categoryId,
      supplierId: payload.supplierId || null,
      name: payload.name,
      description: payload.description || null,
      size: payload.size,
      color: payload.color,
      salePrice: payload.salePrice,
      manufacturingCost: payload.manufacturingCost,
      stock: payload.stock || 0,
      minStock: payload.minStock || 0,
      active: payload.active === undefined ? 1 : Number(payload.active)
    }
  );

  return result.insertId;
};

const update = async (id, payload, db = pool) => {
  await execute(
    db,
    `UPDATE products
     SET
       group_id = :groupId,
       category_id = :categoryId,
       supplier_id = :supplierId,
       name = :name,
       description = :description,
       size = :size,
       color = :color,
       sale_price = :salePrice,
       manufacturing_cost = :manufacturingCost,
       min_stock = :minStock
     WHERE id = :id`,
    {
      id,
      groupId: payload.groupId || null,
      categoryId: payload.categoryId,
      supplierId: payload.supplierId || null,
      name: payload.name,
      description: payload.description || null,
      size: payload.size,
      color: payload.color,
      salePrice: payload.salePrice,
      manufacturingCost: payload.manufacturingCost,
      minStock: payload.minStock
    }
  );
};

const updateStatus = async (id, active, db = pool) => {
  await execute(
    db,
    `UPDATE products
     SET active = :active
     WHERE id = :id`,
    { id, active: Number(active) }
  );
};

const replaceImages = async (productId, images, db = pool) => {
  await execute(db, 'DELETE FROM product_images WHERE product_id = :productId', { productId });

  for (const [index, image] of images.entries()) {
    await execute(
      db,
      `INSERT INTO product_images (product_id, image_url, is_main)
       VALUES (:productId, :imageUrl, :isMain)`,
      {
        productId,
        imageUrl: image.imageUrl,
        isMain: image.isMain === undefined ? Number(index === 0) : Number(image.isMain)
      }
    );
  }
};

const findGrouped = async (filters = {}, db = pool) => {
  const rows = await findAll({ ...filters, limit: 500, offset: 0 }, db);

  const groups = new Map();

  for (const row of rows) {
    const key = row.groupId || `single-${row.id}`;

    if (!groups.has(key)) {
      groups.set(key, {
        groupId: row.groupId,
        groupName: row.groupName || row.name,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        variants: []
      });
    }

    groups.get(key).variants.push(row);
  }

  return [...groups.values()].map((group) => {
    const prices = group.variants.map((v) => Number(v.salePrice));
    const stock = group.variants.reduce((sum, v) => sum + Number(v.stock), 0);

    return {
      ...group,
      variantCount: group.variants.length,
      totalStock: stock,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      hasLowStock: group.variants.some((v) => Number(v.isLowStock) === 1)
    };
  });
};

module.exports = {
  findAll,
  countAll,
  findById,
  findGrouped,
  findOrCreateGroup,
  create,
  update,
  updateStatus,
  replaceImages
};

