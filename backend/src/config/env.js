require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

module.exports = {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    ML_PIPELINE_URL: process.env.ML_PIPELINE_URL || 'http://localhost:8000',
    OCR_SERVICE_URL: process.env.OCR_SERVICE_URL || 'http://localhost:8001',
    OCR_CONFIDENCE_THRESHOLD: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.75,
    DOSAGE_ANOMALY_THRESHOLD: parseFloat(process.env.DOSAGE_ANOMALY_THRESHOLD) || 0.6,
    INTERACTION_WEIGHT: parseFloat(process.env.INTERACTION_WEIGHT) || 0.35,
};
