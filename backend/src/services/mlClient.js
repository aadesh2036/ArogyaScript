/**
 * ML Pipeline Client — calls the FastAPI anomaly-detection service.
 * Falls back gracefully if the ML service is unreachable.
 */

const { createLogger } = require('../utils/logger');

const log = createLogger('MLClient');

const ML_PIPELINE_URL = process.env.ML_PIPELINE_URL || 'http://localhost:8000';

/**
 * Call the ML pipeline for anomaly detection.
 * @param {{ entities: Array, ocrText: string, prescriptionId: string }} payload
 * @returns {{ status: string, flags: Array, riskScore?: object, error?: string }}
 */
async function callMLPipeline(payload) {
  const start = Date.now();
  try {
    const fetch = require('node-fetch');

    const response = await fetch(`${ML_PIPELINE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prescription_id: payload.prescriptionId,
        ocr_text: payload.ocrText,
        entities: payload.entities.map((e) => ({
          drug_name: e.drugName,
          dosage: e.dosage || '',
          frequency: e.frequency || '',
          duration: e.duration || '',
        })),
      }),
      timeout: 30000,
    });

    if (!response.ok) {
      const errBody = await response.text();
      log.warn('ML pipeline returned non-OK', { status: response.status, body: errBody });
      return { status: 'failed', flags: [], error: `ML service error: ${response.status}`, durationMs: Date.now() - start };
    }

    const data = await response.json();

    // Normalize ML response to our anomaly flag format
    const flags = (data.anomalies || data.flags || []).map((a) => ({
      type: a.type || a.anomaly_type || 'unknown',
      severity: a.severity || 'warning',
      message: a.message || a.description || '',
      detail: a.detail || '',
      drugName: a.drug_name || a.drugName || '',
    }));

    const riskScore = data.risk_score
      ? {
          overall: data.risk_score.overall || data.risk_score.score || 0,
          level: data.risk_score.level || 'safe',
          signals: (data.risk_score.signals || []).map((s) => ({
            signal: s.signal || s.type || '',
            weight: s.weight || s.score || 0,
            detail: s.detail || s.description || '',
          })),
        }
      : null;

    log.info('ML pipeline completed', { flagCount: flags.length });

    return {
      status: 'success',
      flags,
      interactions: data.interactions || [],
      riskScore,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    log.error('ML pipeline call failed', { error: err.message });
    return {
      status: 'failed',
      flags: [],
      error: err.message,
      durationMs: Date.now() - start,
    };
  }
}

module.exports = { callMLPipeline };
