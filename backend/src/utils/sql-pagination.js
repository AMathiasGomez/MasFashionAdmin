const toSafeInteger = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const paginationClause = (filters = {}, defaultLimit = 10, maxLimit = 100) => {
  const limit = toSafeInteger(filters.limit, defaultLimit, maxLimit);
  const offset = toSafeInteger(filters.offset, 0, Number.MAX_SAFE_INTEGER);

  return `LIMIT ${limit} OFFSET ${offset}`;
};

const limitClause = (value, defaultLimit = 10, maxLimit = 100) => {
  const limit = toSafeInteger(value, defaultLimit, maxLimit);

  return `LIMIT ${limit}`;
};

module.exports = {
  toSafeInteger,
  paginationClause,
  limitClause
};
