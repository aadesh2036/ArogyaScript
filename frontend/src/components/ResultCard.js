import PipelineProgress from './PipelineProgress';
import { FiImage, FiAlertTriangle, FiShield, FiActivity, FiClipboard } from 'react-icons/fi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const SEVERITY_COLORS = {
  safe: 'bg-emerald-100 text-emerald-800',
  low: 'bg-sky-100 text-sky-800',
  moderate: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS = {
  urgent: 'bg-red-50/80 text-red-800 border-red-200/60',
  high: 'bg-orange-50/80 text-orange-800 border-orange-200/60',
  medium: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
  low: 'bg-sky-50/80 text-sky-800 border-sky-200/60',
};

const FLAG_SEVERITY_COLORS = {
  critical: 'bg-red-50/80 border-red-200/60 text-red-800',
  warning: 'bg-amber-50/80 border-amber-200/60 text-amber-800',
  info: 'bg-sky-50/80 border-sky-200/60 text-sky-800',
};

export default function ResultCard({ data }) {
  const {
    prescriptionId, extractedEntities, interactions, riskScore,
    metadata, ocrText, anomalyFlags, interventions, pipelineStatus,
    imagePath, processedImagePath,
  } = data;

  const imageUrl = imagePath ? `${API_BASE}/uploads/${imagePath.replace(/^uploads[\\/]/, '')}` : null;
  const processedUrl = processedImagePath ? `${API_BASE}/uploads/${processedImagePath.replace(/^uploads[\\/]/, '')}` : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary-800">Prescription {prescriptionId}</h3>
          <p className="text-sm text-primary-500/60">{metadata?.ocrEngine} — {metadata?.processingTimeMs}ms</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary-800">{riskScore?.overall ?? '—'}</div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${SEVERITY_COLORS[riskScore?.level] || 'bg-gray-100 text-gray-600'}`}>
            {riskScore?.level?.toUpperCase() || 'PENDING'}
          </span>
        </div>
      </div>

      {/* Images — Original & Processed */}
      {(imageUrl || processedUrl) && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiImage className="text-primary-600" size={18} />
            <h4 className="font-semibold text-primary-800">Prescription Images</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imageUrl && (
              <div>
                <p className="text-xs font-medium text-primary-600/60 mb-2 uppercase tracking-wide">Original Image</p>
                <div className="rounded-xl overflow-hidden border border-white/30 shadow-glass">
                  <img src={imageUrl} alt="Original prescription" className="w-full h-auto object-contain max-h-80 bg-white/50" />
                </div>
              </div>
            )}
            {processedUrl && (
              <div>
                <p className="text-xs font-medium text-primary-600/60 mb-2 uppercase tracking-wide">Processed Image</p>
                <div className="rounded-xl overflow-hidden border border-white/30 shadow-glass">
                  <img src={processedUrl} alt="Processed prescription" className="w-full h-auto object-contain max-h-80 bg-white/50" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Status */}
      {pipelineStatus && (
        <PipelineProgress status={pipelineStatus} />
      )}

      {/* OCR Text */}
      {ocrText && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <FiClipboard className="text-primary-600" size={18} />
            <h4 className="font-semibold text-primary-800">OCR Extracted Text</h4>
          </div>
          <pre className="glass rounded-xl p-4 text-sm text-primary-700 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto custom-scrollbar">
            {ocrText}
          </pre>
          {data.ocrConfidence != null && (
            <p className="text-xs text-primary-500/50 mt-2">
              Confidence: {(data.ocrConfidence * 100).toFixed(0)}%
            </p>
          )}
        </div>
      )}

      {/* Extracted Drugs */}
      {extractedEntities?.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiActivity className="text-primary-600" size={18} />
            <h4 className="font-semibold text-primary-800">Extracted Medications</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-primary-600/60 border-b border-white/30">
                <tr>
                  <th className="pb-2">Drug</th>
                  <th className="pb-2">Dosage</th>
                  <th className="pb-2">Frequency</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Confidence</th>
                </tr>
              </thead>
              <tbody className="text-primary-700">
                {extractedEntities.map((e, i) => (
                  <tr key={i} className="border-b border-white/20 last:border-0">
                    <td className="py-2.5 font-medium">{e.drugName}</td>
                    <td className="py-2.5">{e.dosage || <span className="text-primary-400 italic">missing</span>}</td>
                    <td className="py-2.5">{e.frequency || <span className="text-primary-400 italic">missing</span>}</td>
                    <td className="py-2.5">{e.duration || <span className="text-primary-400 italic">missing</span>}</td>
                    <td className="py-2.5">{e.confidence ? `${(e.confidence * 100).toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Anomaly Flags */}
      {anomalyFlags?.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertTriangle className="text-amber-500" size={18} />
            <h4 className="font-semibold text-primary-800">Anomaly Flags ({anomalyFlags.length})</h4>
          </div>
          <div className="space-y-2">
            {anomalyFlags.map((flag, i) => (
              <div key={i} className={`border rounded-xl p-3 backdrop-blur-sm ${FLAG_SEVERITY_COLORS[flag.severity] || 'bg-gray-50/80 border-gray-200/60'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/60">{flag.type}</span>
                  <span className="text-xs font-semibold uppercase">{flag.severity}</span>
                  {flag.drugName && <span className="ml-auto text-xs opacity-70">{flag.drugName}</span>}
                </div>
                <p className="text-sm mt-1">{flag.message}</p>
                {flag.detail && <p className="text-xs mt-1 opacity-75">{flag.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactions */}
      {interactions?.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiShield className="text-red-500" size={18} />
            <h4 className="font-semibold text-primary-800">Drug Interactions</h4>
          </div>
          <div className="space-y-3">
            {interactions.map((intr, i) => (
              <div key={i} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-primary-700">{intr.drug1}</span>
                  <span className="text-primary-400">↔</span>
                  <span className="font-medium text-primary-700">{intr.drug2}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[intr.severity]}`}>
                    {intr.severity}
                  </span>
                </div>
                <p className="text-sm text-primary-600/70">{intr.description}</p>
                {intr.recommendation && (
                  <p className="text-sm text-primary-600 mt-1 font-medium">→ {intr.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interventions */}
      {interventions?.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold text-primary-800 mb-4">Clinical Interventions ({interventions.length})</h4>
          <div className="space-y-3">
            {interventions.map((iv, i) => (
              <div key={i} className={`border rounded-xl p-4 backdrop-blur-sm ${PRIORITY_COLORS[iv.priority] || 'bg-gray-50/80 border-gray-200/60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/60">{iv.type}</span>
                  <span className="text-xs font-bold uppercase">{iv.priority}</span>
                </div>
                <p className="text-sm mt-1">{iv.message}</p>
                {iv.relatedDrugs?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {iv.relatedDrugs.map((drug, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-white/50 rounded-full">{drug}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Signals */}
      {riskScore?.signals?.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold text-primary-800 mb-4">Risk Signals</h4>
          <div className="space-y-2">
            {riskScore.signals.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm glass rounded-lg px-3 py-2">
                <span className="text-primary-700">{s.detail}</span>
                <span className="font-mono font-semibold text-primary-500">+{s.weight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partial results notice */}
      {pipelineStatus?.overall === 'partial' && (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 text-sm text-amber-800 backdrop-blur-sm">
          <strong>Partial Results:</strong> Some pipeline modules failed. Results above may be incomplete.
          Check the Pipeline Progress section for details.
        </div>
      )}
    </div>
  );
}
