export default function StatsCards({ stats }) {
  const cards = [
    { label: 'Total Prescriptions', value: stats.totalPrescriptions, color: 'text-primary-600' },
    { label: 'Avg Risk Score', value: stats.avgRiskScore, color: 'text-warning-500' },
    { label: 'Interactions Found', value: stats.interactionsDetected, color: 'text-danger-500' },
    { label: 'Common Drug', value: stats.commonDrugs?.[0]?.name || '—', color: 'text-accent-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <p className="text-sm text-gray-500 font-medium">{c.label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
