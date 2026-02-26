/**
 * Database Initialization Script
 *
 * - Creates all collections (if not exist)
 * - Applies all compound indexes
 * - Applies MongoDB JSON schema validators
 *
 * Run: node src/database/init.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const INDEXES = require('./indexes');
const VALIDATORS = require('./validators');
const logger = require('../utils/logger');

const applyIndexes = async (db) => {
    logger.info('[DB Init] Applying indexes...');
    let created = 0;
    let skipped = 0;

    for (const { collection, key, options } of INDEXES) {
        try {
            const col = db.collection(collection);
            const existing = await col.indexExists(options.name);
            if (existing) {
                skipped++;
                continue;
            }
            await col.createIndex(key, options);
            logger.info(`  ✔ Index created: ${options.name} on ${collection}`);
            created++;
        } catch (err) {
            // Text indexes: only one allowed per collection — skip gracefully
            if (err.codeName === 'IndexOptionsConflict' || err.code === 85 || err.code === 86) {
                logger.warn(`  ⚠  Index conflict (skipped): ${options.name} — ${err.message}`);
            } else {
                logger.error(`  ✖ Index failed: ${options.name} — ${err.message}`);
            }
        }
    }

    logger.info(`[DB Init] Indexes — ${created} created, ${skipped} already exist.`);
};

const applyValidators = async (db) => {
    logger.info('[DB Init] Applying collection validators...');
    const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);

    for (const { collection, validator, validationLevel, validationAction } of VALIDATORS) {
        try {
            if (!existingCollections.includes(collection)) {
                await db.createCollection(collection, { validator, validationLevel, validationAction });
                logger.info(`  ✔ Collection created with validator: ${collection}`);
            } else {
                await db.command({
                    collMod: collection,
                    validator,
                    validationLevel,
                    validationAction,
                });
                logger.info(`  ✔ Validator updated: ${collection}`);
            }
        } catch (err) {
            logger.error(`  ✖ Validator failed for ${collection}: ${err.message}`);
        }
    }
};

const init = async () => {
    logger.info('─────────────────────────────────────────');
    logger.info('  ArogyaScript Database Initialization  ');
    logger.info('─────────────────────────────────────────');

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    logger.info(`Connected to MongoDB: ${mongoose.connection.host}`);

    const db = mongoose.connection.db;

    await applyValidators(db);
    await applyIndexes(db);

    await mongoose.disconnect();
    logger.info('─────────────────────────────────────────');
    logger.info('  ✅ Database initialization complete!    ');
    logger.info('─────────────────────────────────────────');
};

init().catch((err) => {
    logger.error('DB init failed:', err.message);
    process.exit(1);
});
