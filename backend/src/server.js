require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Register pipeline event listeners
require('./services/pipelineOrchestrator');

const PORT = parseInt(process.env.PORT, 10) || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 ArogyaScript API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server:', err.message);
  process.exit(1);
});
