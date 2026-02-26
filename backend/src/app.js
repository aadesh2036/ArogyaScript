require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const prescriptionRoutes = require('./modules/prescriptions/routes');
const imageQualityRoutes = require('./modules/imageQuality/routes');
const ocrRoutes = require('./modules/ocr/routes');
const entityRoutes = require('./modules/entities/routes');
const drugNormRoutes = require('./modules/drugNormalization/routes');
const interactionRoutes = require('./modules/interaction/routes');
const riskRoutes = require('./modules/riskEngine/routes');
const analyticsRoutes = require('./modules/analytics/routes');
const annotationRoutes = require('./modules/annotations/routes');
const configVersionRoutes = require('./modules/configVersioning/routes');

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/prescriptions`, prescriptionRoutes);
app.use(`${API}/image-quality`, imageQualityRoutes);
app.use(`${API}/ocr`, ocrRoutes);
app.use(`${API}/entities`, entityRoutes);
app.use(`${API}/drug-normalization`, drugNormRoutes);
app.use(`${API}/interactions`, interactionRoutes);
app.use(`${API}/risk`, riskRoutes);
app.use(`${API}/analytics`, analyticsRoutes);
app.use(`${API}/annotations`, annotationRoutes);
app.use(`${API}/config-versions`, configVersionRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── Centralised Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
