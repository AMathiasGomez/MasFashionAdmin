const app = require('./app');
const env = require('./config/env');
const { testDatabaseConnection } = require('./config/database');
const scheduledReportsJob = require('./jobs/scheduled-reports.job');

const startServer = async () => {
  try {
    await testDatabaseConnection();

    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}${env.apiPrefix}`);
    });

    scheduledReportsJob.start();
  } catch (error) {
    console.error('Failed to start API:', error.message || error.code || error);

    if (Array.isArray(error.errors)) {
      error.errors.forEach((subError, index) => {
        console.error(`  cause[${index}]:`, subError.message || subError.code || subError);
      });
    }

    if (error.stack) {
      console.error(error.stack);
    }

    process.exit(1);
  }
};

startServer();

