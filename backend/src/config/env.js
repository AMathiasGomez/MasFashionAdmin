require('dotenv').config();

const getRequiredEnv = (key) => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',

  db: {
    url: process.env.MYSQL_URL || process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clothing_admin',
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
  },

  jwt: {
    secret: getRequiredEnv('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: process.env.JWT_ISSUER || 'clothing-admin-api'
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  },

  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || ''
  },

  scheduledReport: {
    enabled: process.env.REPORT_SCHEDULE_ENABLED === 'true',
    cron: process.env.REPORT_SCHEDULE_CRON || '0 8 * * 1',
    type: process.env.REPORT_SCHEDULE_TYPE || 'sales',
    format: process.env.REPORT_SCHEDULE_FORMAT || 'xlsx',
    recipients: (process.env.REPORT_SCHEDULE_RECIPIENTS || '').split(',').map((email) => email.trim()).filter(Boolean)
  }
};

module.exports = env;

