/**
 * Master Seed Runner
 *
 * Runs all seed modules in the correct dependency order.
 *
 * Usage:
 *   node src/database/seed/index.js
 *
 * Or via package.json script:
 *   npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../../utils/logger');

const seedConfig = require('./config.seed');
const seedUsers = require('./users.seed');
const seedDrugs = require('./drugs.seed');
const seedInteractions = require('./interactions.seed');

const run = async () => {
    logger.info('══════════════════════════════════════════');
    logger.info('       ArogyaScript Database Seeder      ');
    logger.info('══════════════════════════════════════════');

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    logger.info(`Connected to: ${mongoose.connection.host}`);
    logger.info('──────────────────────────────────────────');

    await seedConfig(logger);
    await seedUsers(logger);
    await seedDrugs(logger);
    await seedInteractions(logger);

    logger.info('──────────────────────────────────────────');
    logger.info('  ✅ All seed data loaded successfully!    ');
    logger.info('══════════════════════════════════════════');

    await mongoose.disconnect();
};

run().catch((err) => {
    logger.error('Seeding failed:', err.message);
    process.exit(1);
});
