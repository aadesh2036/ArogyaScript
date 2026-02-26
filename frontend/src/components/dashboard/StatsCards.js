export default function StatsCards({ stats }) {
  const cards = [
    { label: 'Total Prescriptions', value: stats.totalPrescriptions, color: 'text-accent-600', icon: '📋' },
    { label: 'Avg Risk Score', value: stats.avgRiskScore, color: 'text-amber-600', icon: '⚠️' },
    { label: 'Interactions Found', value: stats.interactionsDetected, color: 'text-red-600', icon: '💊' },
    { label: 'Common Drug', value: stats.commonDrugs?.[0]?.name || '—', color: 'text-navy', icon: '🏥' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 sm:p-5 hover:shadow-card-hover transition-all">
          <div className="flex items-start justify-between">
            <p className="text-xs sm:text-sm text-primary-500/60 leading-tight">{c.label}</p>
            <span className="text-base sm:text-lg">{c.icon}</span>
          </div>
          <p className={`text-xl sm:text-2xl font-bold mt-1.5 truncate ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
