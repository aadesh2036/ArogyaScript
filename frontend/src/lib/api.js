import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      // Don't redirect if we're already on login/register pages
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Poll the pipeline status until it's no longer 'processing'/'queued'.
 * Returns the final status data.
 *
 * @param {string} prescriptionId
 * @param {function} onUpdate  — called with each status update
 * @param {number} intervalMs — polling interval (default 1500ms)
 * @param {number} maxAttempts — max polling attempts (default 60)
 * @returns {Promise<object>} final status
 */
export async function pollPipelineStatus(prescriptionId, onUpdate, intervalMs = 1500, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { data } = await api.get(`/prescriptions/${prescriptionId}/status`);
      const status = data.data;
      if (onUpdate) onUpdate(status);

      const overall = status.pipelineStatus?.overall;
      if (overall && overall !== 'queued' && overall !== 'processing') {
        return status;
      }
    } catch (err) {
      // Silently retry on transient errors
      console.warn('Poll error:', err.message);
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('Pipeline polling timed out');
}

export default api;
