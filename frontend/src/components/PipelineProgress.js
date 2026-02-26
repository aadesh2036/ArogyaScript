import { FiCheckCircle, FiXCircle, FiLoader, FiClock } from 'react-icons/fi';

const STEPS = [
  { key: 'ocr', label: 'OCR Text Extraction' },
  { key: 'structuring', label: 'Drug Entity Extraction' },
  { key: 'anomaly', label: 'Anomaly Detection' },
  { key: 'intervention', label: 'Intervention Analysis' },
];

const STATUS_ICON = {
  success: <FiCheckCircle className="text-green-500" size={20} />,
  failed: <FiXCircle className="text-red-500" size={20} />,
  skipped: <FiClock className="text-gray-400" size={20} />,
};

export default function PipelineProgress({ status }) {
  if (!status) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">Pipeline Progress</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          status.overall === 'completed' ? 'bg-green-100 text-green-800'
            : status.overall === 'partial' ? 'bg-yellow-100 text-yellow-800'
              : status.overall === 'failed' ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
        }`}>
          {status.overall?.toUpperCase() || 'PROCESSING'}
        </span>
      </div>

      <div className="space-y-3">
        {STEPS.map(({ key, label }) => {
          const step = status[key];
          const stepStatus = step?.status || 'skipped';
          const isRunning = stepStatus === 'skipped' && status.overall === 'processing';

          return (
            <div key={key} className="flex items-center gap-3">
              {isRunning ? (
                <FiLoader className="text-blue-500 animate-spin" size={20} />
              ) : (
                STATUS_ICON[stepStatus] || <FiClock className="text-gray-300" size={20} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {step?.error && (
                  <p className="text-xs text-red-500 mt-0.5">{step.error}</p>
                )}
                {step?.durationMs > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{step.durationMs}ms</p>
                )}
              </div>
              <span className={`text-xs ${
                stepStatus === 'success' ? 'text-green-600'
                  : stepStatus === 'failed' ? 'text-red-600'
                    : 'text-gray-400'
              }`}>
                {isRunning ? 'Running...' : stepStatus}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
