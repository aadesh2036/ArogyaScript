/**
 * Database Index Definitions
 *
 * Defines all indexes for every collection beyond what is defined
 * in the Mongoose schema decorators. Run via `src/database/init.js`.
 *
 * Format: { collection, key, options }
 */

const INDEXES = [
    // ── users ─────────────────────────────────────────────────────────────────
    { collection: 'users', key: { email: 1 }, options: { unique: true, name: 'idx_users_email' } },
    { collection: 'users', key: { role: 1 }, options: { name: 'idx_users_role' } },
    { collection: 'users', key: { createdAt: -1 }, options: { name: 'idx_users_createdAt' } },

    // ── prescriptions ─────────────────────────────────────────────────────────
    { collection: 'prescriptions', key: { userId: 1, createdAt: -1 }, options: { name: 'idx_rx_user_date' } },
    { collection: 'prescriptions', key: { pipelineStatus: 1 }, options: { name: 'idx_rx_status' } },
    { collection: 'prescriptions', key: { configVersionId: 1 }, options: { name: 'idx_rx_configVersion' } },

    // ── image_quality ─────────────────────────────────────────────────────────
    { collection: 'imagequalities', key: { prescriptionId: 1 }, options: { unique: true, name: 'idx_iq_rxId' } },
    { collection: 'imagequalities', key: { isReadable: 1 }, options: { name: 'idx_iq_readable' } },

    // ── ocr_outputs ───────────────────────────────────────────────────────────
    { collection: 'ocroutputs', key: { prescriptionId: 1 }, options: { unique: true, name: 'idx_ocr_rxId' } },
    { collection: 'ocroutputs', key: { averageConfidence: 1 }, options: { name: 'idx_ocr_confidence' } },

    // ── entities ──────────────────────────────────────────────────────────────
    { collection: 'entities', key: { prescriptionId: 1 }, options: { unique: true, name: 'idx_entities_rxId' } },
    { collection: 'entities', key: { 'drugs.normalizedName': 1 }, options: { name: 'idx_entities_drug' } },

    // ── drugsynonyms ──────────────────────────────────────────────────────────
    { collection: 'drugsynonyms', key: { genericName: 1 }, options: { unique: true, name: 'idx_drugs_generic' } },
    { collection: 'drugsynonyms', key: { brandNames: 1 }, options: { name: 'idx_drugs_brand' } },
    {
        collection: 'drugsynonyms',
        key: { genericName: 'text', brandNames: 'text', synonyms: 'text' },
        options: { name: 'idx_drugs_text_search' },
    },

    // ── interactionkbs ────────────────────────────────────────────────────────
    {
        collection: 'interactionkbs',
        key: { drugA: 1, drugB: 1 },
        options: { unique: true, name: 'idx_kb_pair' },
    },
    { collection: 'interactionkbs', key: { severity: 1 }, options: { name: 'idx_kb_severity' } },

    // ── interactionresults ────────────────────────────────────────────────────
    {
        collection: 'interactionresults',
        key: { prescriptionId: 1 },
        options: { unique: true, name: 'idx_intResult_rxId' },
    },
    {
        collection: 'interactionresults',
        key: { 'interactions.severity': 1 },
        options: { name: 'idx_intResult_severity' },
    },

    // ── riskscores ────────────────────────────────────────────────────────────
    { collection: 'riskscores', key: { prescriptionId: 1 }, options: { unique: true, name: 'idx_risk_rxId' } },
    { collection: 'riskscores', key: { category: 1 }, options: { name: 'idx_risk_category' } },
    { collection: 'riskscores', key: { overallScore: -1 }, options: { name: 'idx_risk_score' } },

    // ── riskreasons ───────────────────────────────────────────────────────────
    { collection: 'riskreasons', key: { prescriptionId: 1 }, options: { unique: true, name: 'idx_riskReason_rxId' } },
    { collection: 'riskreasons', key: { 'factors.sourceModule': 1 }, options: { name: 'idx_riskReason_source' } },

    // ── events (analytics) ────────────────────────────────────────────────────
    { collection: 'events', key: { prescriptionId: 1, eventType: 1 }, options: { name: 'idx_events_rx_type' } },
    { collection: 'events', key: { eventType: 1 }, options: { name: 'idx_events_type' } },
    { collection: 'events', key: { timestamp: -1 }, options: { name: 'idx_events_timestamp' } },

    // ── annotations ───────────────────────────────────────────────────────────
    { collection: 'annotations', key: { prescriptionId: 1 }, options: { name: 'idx_ann_rxId' } },
    { collection: 'annotations', key: { annotatedBy: 1 }, options: { name: 'idx_ann_user' } },

    // ── configversions ────────────────────────────────────────────────────────
    { collection: 'configversions', key: { versionName: 1 }, options: { unique: true, name: 'idx_cfg_name' } },
    { collection: 'configversions', key: { isActive: 1, createdAt: -1 }, options: { name: 'idx_cfg_active' } },
];

module.exports = INDEXES;
