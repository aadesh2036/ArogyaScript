import { BookOpen, Info, AlertTriangle } from 'lucide-react';

const SEVERITY_COLORS = {
  safe: 'bg-green-100 text-green-800',
  low: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function ResultCard({ data }) {
  const { prescriptionId, extractedEntities, interactions, riskScore, metadata } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold">Prescription {prescriptionId}</h3>
          <p className="text-sm text-gray-400">{metadata?.ocrEngine} — {metadata?.processingTimeMs}ms</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">{riskScore?.overall}</div>
          <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_COLORS[riskScore?.level]}`}>
            {riskScore?.level?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Extracted Drugs */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold mb-4">Extracted Medications</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr>
                <th className="pb-2">Drug</th>
                <th className="pb-2">Dosage</th>
                <th className="pb-2">Frequency</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {extractedEntities?.map((e, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 font-medium">{e.drugName}</td>
                  <td className="py-2">{e.dosage}</td>
                  <td className="py-2">{e.frequency}</td>
                  <td className="py-2">{e.duration}</td>
                  <td className="py-2">{(e.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactions */}
      {interactions?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h4 className="font-semibold mb-4">Drug Interactions</h4>
          <div className="space-y-3">
            {interactions.map((intr, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{intr.drug1}</span>
                  <span className="text-gray-400">↔</span>
                  <span className="font-medium">{intr.drug2}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLORS[intr.severity]}`}>
                    {intr.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{intr.description}</p>
                {intr.recommendation && (
                  <p className="text-sm text-primary-600 mt-1">→ {intr.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Knowledge Enrichment (Architecture: Interaction KB) */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-primary-500" />
          Knowledge Enrichment
          <span className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-bold ml-1">interaction_kb</span>
        </h4>
        {extractedEntities?.length > 0 ? (
          <div className="space-y-3">
            {extractedEntities.map((e, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{e.drugName}</span>
                  <span className="text-xs text-slate-500 font-mono">{e.dosage}</span>
                </div>
                <p className="text-sm text-slate-600">
                  {e.drugName === 'Amoxicillin' || e.drugName === 'amoxicillin'
                    ? 'Penicillin-type antibiotic. Common side effects: diarrhea, nausea. Monitor for allergic reactions.'
                    : 'Drug information will be enriched from the curated knowledge base once the backend is connected.'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No entities extracted yet.</p>
        )}
      </div>

      {/* Explainability: Risk Signals (Architecture: risk_reasons collection) */}
      {riskScore?.signals?.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Risk Explainability
            <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold ml-1">risk_reasons</span>
          </h4>
          <div className="space-y-2">
            {riskScore.signals.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-slate-400 shrink-0" />
                  <span className="text-gray-700">{s.detail}</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.rule && <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{s.rule}</span>}
                  <span className="font-mono font-bold text-amber-600">+{s.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
