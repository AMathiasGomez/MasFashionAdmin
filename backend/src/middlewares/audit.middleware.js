const auditModel = require('../modules/audit/audit.model');

const SENSITIVE_KEYS = ['password', 'confirmPassword', 'credential'];

const sanitize = (body) => {
  if (!body || typeof body !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(body).filter(([key]) => !SENSITIVE_KEYS.includes(key))
  );
};

const auditLogger = (action, entityType) => (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    res.locals.auditResponseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) {
      return;
    }

    const body = res.locals.auditResponseBody;
    const entityId = body?.data?.id ?? (req.params.id ? Number(req.params.id) : null);

    auditModel
      .record({
        userId: req.user.id,
        action,
        entityType,
        entityId,
        details: sanitize(req.body)
      })
      .catch((error) => console.error('[audit] failed to record entry:', error.message));
  });

  next();
};

module.exports = { auditLogger };
