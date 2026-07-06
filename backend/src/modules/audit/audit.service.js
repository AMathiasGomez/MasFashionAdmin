const auditModel = require('./audit.model');

const listAuditLogs = async (filters) => {
  const page = Number(filters.page || 1);
  const limit = Math.min(Number(filters.limit || 20), 100);
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    auditModel.findAll({ ...filters, limit, offset }),
    auditModel.countAll(filters)
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

module.exports = {
  listAuditLogs
};
