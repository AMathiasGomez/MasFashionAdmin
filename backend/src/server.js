const app = require('./app');
const env = require('./config/env');
const { testDatabaseConnection } = require('./config/database');

const startServer = async () => {
  try {
    await testDatabaseConnection();

    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}${env.apiPrefix}`);
    });
  } catch (error) {
    console.error('Failed to start API:', error.message);
    process.exit(1);
  }
};

startServer();

