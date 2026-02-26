const ConfigVersion = require('../../modules/configVersioning/model');

const configVersions = [
    {
        versionName: 'v1.0-default',
        interactionWeight: 0.35,
        ocrConfidenceThreshold: 0.75,
        dosageAnomalyThreshold: 0.6,
        isActive: false,
        notes: 'Initial default configuration — conservative thresholds',
    },
    {
        versionName: 'v1.1-relaxed',
        interactionWeight: 0.30,
        ocrConfidenceThreshold: 0.65,
        dosageAnomalyThreshold: 0.5,
        isActive: false,
        notes: 'Relaxed OCR threshold — for low-quality prescription scans',
    },
    {
        versionName: 'v2.0-production',
        interactionWeight: 0.40,
        ocrConfidenceThreshold: 0.80,
        dosageAnomalyThreshold: 0.65,
        isActive: true,
        notes: 'Current production config — higher interaction risk weight, stricter OCR threshold',
    },
];

const seed = async (logger) => {
    for (const cfg of configVersions) {
        await ConfigVersion.findOneAndUpdate({ versionName: cfg.versionName }, cfg, { upsert: true });
    }
    logger.info(`  ✔ Config Versions: ${configVersions.length} records seeded`);
};

module.exports = seed;
