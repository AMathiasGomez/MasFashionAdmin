const { sendSuccess } = require('../../utils/api-response');
const { testDatabaseConnection } = require('../../config/database');

const getHealth = async (req, res) => {
  await testDatabaseConnection();

  sendSuccess(res, {
    service: 'clothing-admin-api',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealth
};

