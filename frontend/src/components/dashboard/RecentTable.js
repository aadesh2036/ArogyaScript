import Link from 'next/link';

const LEVEL_BADGE = {
  safe: 'bg-green-100 text-green-800',
  low: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const PIPELINE_BADGE = {
  completed: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  processing: 'bg-blue-100 text-blue-700',
  queued: 'bg-gray-100 text-gray-600',
};

export default function RecentTable({ prescriptions }) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <h4 className="font-semibold text-navy mb-4">Recent Prescriptions</h4>
      {prescriptions.length === 0 ? (
        <p className="text-primary-400 text-sm">No prescriptions yet</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-primary-500/60 border-b border-white/30">
                <tr>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Drugs</th>
                  <th className="pb-2">Risk</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.slice(0, 10).map((p) => (
                  <tr key={p.prescriptionId} className="border-b border-white/20 last:border-0">
                    <td className="py-2.5">
                      <Link href={`/results/${p.prescriptionId}`} className="text-accent-600 hover:underline font-medium">
                        {p.prescriptionId?.slice(-6) || p.prescriptionId}
                      </Link>
                    </td>
                    <td className="py-2.5 text-primary-700">{p.drugCount}</td>
                    <td className="py-2.5">
                      {p.riskLevel ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_BADGE[p.riskLevel] || 'bg-gray-100 text-gray-600'}`}>
                          {p.riskScore ?? '—'} — {p.riskLevel}
                        </span>
                      ) : (
                        <span className="text-xs text-primary-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${PIPELINE_BADGE[p.pipelineStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {p.pipelineStatus || p.status || 'unknown'}
                      </span>
                    </td>
                    <td className="py-2.5 text-primary-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-3">
            {prescriptions.slice(0, 10).map((p) => (
              <Link key={p.prescriptionId} href={`/results/${p.prescriptionId}`}
                className="block glass rounded-xl p-3 hover:bg-white/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-accent-600">
                    {p.prescriptionId?.slice(-6) || p.prescriptionId}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${PIPELINE_BADGE[p.pipelineStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {p.pipelineStatus || p.status || 'unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-primary-500">
                  <span>{p.drugCount} drugs</span>
                  {p.riskLevel && (
                    <span className={`px-1.5 py-0.5 rounded-full ${LEVEL_BADGE[p.riskLevel]}`}>
                      {p.riskLevel}
                    </span>
                  )}
                  <span className="ml-auto text-primary-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
