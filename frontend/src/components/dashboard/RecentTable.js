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
    <div className="glass-card rounded-2xl p-6">
      <h4 className="font-semibold text-navy mb-4">Recent Prescriptions</h4>
      {prescriptions.length === 0 ? (
        <p className="text-gray-400 text-sm">No prescriptions yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b">
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
              <tr key={p.prescriptionId} className="border-b last:border-0">
                <td className="py-2">
                  <Link href={`/results/${p.prescriptionId}`} className="text-primary-600 hover:underline">
                    {p.prescriptionId}
                  </Link>
                </td>
                <td className="py-2">{p.drugCount}</td>
                <td className="py-2">
                  {p.riskLevel ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_BADGE[p.riskLevel] || 'bg-gray-100 text-gray-600'}`}>
                      {p.riskScore ?? '—'} — {p.riskLevel}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PIPELINE_BADGE[p.pipelineStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {p.pipelineStatus || p.status || 'unknown'}
                  </span>
                </td>
                <td className="py-2 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
