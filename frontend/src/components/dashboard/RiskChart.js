import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = {
  safe: '#10b981',
  low: '#3b82f6',
  moderate: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

export default function RiskChart({ distribution }) {
  const labels = Object.keys(distribution);
  const data = {
    labels: labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [
      {
        data: labels.map((l) => distribution[l]),
        backgroundColor: labels.map((l) => COLORS[l]),
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <h4 className="font-semibold text-navy mb-4 text-sm sm:text-base">Risk Distribution</h4>
      <div className="max-w-[220px] sm:max-w-[280px] mx-auto">
        <Doughnut data={data} options={{ plugins: { legend: { position: 'bottom' } } }} />
      </div>
    </div>
  );
}
