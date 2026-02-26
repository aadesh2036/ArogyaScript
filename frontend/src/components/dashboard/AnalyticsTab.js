import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

const card = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

const CHART_COLORS   = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const GRID_STYLE     = { color: 'rgba(100,130,160,0.15)', drawBorder: false };
const TICK_STYLE     = { color: '#6b7fa3', font: { size: 11 } };
const LEGEND_STYLE   = { labels: { color: '#2d4060', font: { size: 12 }, boxWidth: 12 } };

export default function AnalyticsTab({ prescriptions = [], stats = {} }) {
  /* ------- Trend over time (submissions per week) ------- */
  const trendData = useMemo(() => {
    const buckets = {};
    prescriptions.forEach((p) => {
      const d = new Date(p.createdAt);
      const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + (new Date(d.getFullYear(), d.getMonth(), 1).getDay())) / 7)).padStart(2, '0')}`;
      buckets[week] = (buckets[week] || 0) + 1;
    });
    const sorted = Object.keys(buckets).sort();
    return {
      labels: sorted.map((w) => w.replace('-W', ' W')),
      datasets: [{
        label: 'Prescriptions',
        data: sorted.map((w) => buckets[w]),
        fill: true,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14,165,233,0.12)',
        pointBackgroundColor: '#0ea5e9',
        tension: 0.4,
      }],
    };
  }, [prescriptions]);

  /* ------- Risk distribution ------- */
  const riskDist = stats.riskDistribution || {};
  const riskLabels = Object.keys(riskDist);
  const doughnutData = {
    labels: riskLabels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [{
      data: riskLabels.map((l) => riskDist[l]),
      backgroundColor: ['#10b981', '#0ea5e9', '#f59e0b', '#f97316', '#ef4444'],
      borderWidth: 2,
      borderColor: 'white',
    }],
  };

  /* ------- Top drugs bar ------- */
  const commonDrugs = stats.commonDrugs || [];
  const barData = {
    labels: commonDrugs.slice(0, 10).map((d) => d._id || d.name || 'Unknown'),
    datasets: [{
      label: 'Frequency',
      data: commonDrugs.slice(0, 10).map((d) => d.count || d.frequency || 0),
      backgroundColor: CHART_COLORS.map((c) => c + 'bb'),
      borderRadius: 6,
    }],
  };

  /* ------- Avg risk trend ------- */
  const avgRiskData = useMemo(() => {
    const byMonth = {};
    prescriptions.forEach((p) => {
      if (p.riskScore == null) return;
      const key = new Date(p.createdAt).toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (!byMonth[key]) byMonth[key] = { sum: 0, n: 0 };
      byMonth[key].sum += p.riskScore;
      byMonth[key].n += 1;
    });
    const keys = Object.keys(byMonth);
    return {
      labels: keys,
      datasets: [{
        label: 'Avg Risk Score',
        data: keys.map((k) => +(byMonth[k].sum / byMonth[k].n).toFixed(1)),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
      }],
    };
  }, [prescriptions]);

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: LEGEND_STYLE, tooltip: { mode: 'index', intersect: false } },
    scales: { x: { grid: GRID_STYLE, ticks: TICK_STYLE }, y: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true } },
  };

  const barOpts = {
    ...lineOpts,
    scales: { x: { grid: { display: false }, ticks: TICK_STYLE }, y: { grid: GRID_STYLE, ticks: TICK_STYLE, beginAtZero: true } },
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { ...LEGEND_STYLE, position: 'bottom' } },
    cutout: '68%',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Upload trend */}
      <motion.div custom={0} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-navy mb-4">Upload Trend (by week)</h3>
        <div className="h-52">
          {trendData.labels.length > 0
            ? <Line data={trendData} options={lineOpts} />
            : <EmptyChart />}
        </div>
      </motion.div>

      {/* Avg risk trend */}
      <motion.div custom={1} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-navy mb-4">Average Risk Score Over Time</h3>
        <div className="h-52">
          {avgRiskData.labels.length > 0
            ? <Line data={avgRiskData} options={lineOpts} />
            : <EmptyChart />}
        </div>
      </motion.div>

      {/* Risk distribution */}
      <motion.div custom={2} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-navy mb-4">Risk Level Distribution</h3>
        <div className="h-52 flex items-center justify-center">
          {riskLabels.length > 0
            ? <Doughnut data={doughnutData} options={doughnutOpts} />
            : <EmptyChart />}
        </div>
      </motion.div>

      {/* Top drugs */}
      <motion.div custom={3} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-navy mb-4">Top 10 Drugs (by Frequency)</h3>
        <div className="h-52">
          {barData.labels.length > 0
            ? <Bar data={barData} options={barOpts} />
            : <EmptyChart />}
        </div>
      </motion.div>

      {/* Summary numbers */}
      <motion.div custom={4} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-4 sm:p-6 lg:col-span-2">
        <h3 className="text-sm font-semibold text-navy mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Prescriptions', value: stats.totalPrescriptions ?? prescriptions.length },
            { label: 'Avg Risk Score',       value: stats.avgRiskScore != null ? stats.avgRiskScore.toFixed(1) : '—' },
            { label: 'Interactions Found',   value: stats.interactionsDetected ?? '—' },
            { label: 'Unique Drugs Seen',    value: commonDrugs.length },
          ].map((s) => (
            <div key={s.label} className="bg-white/30 rounded-xl p-3 sm:p-4">
              <p className="text-xs text-primary-400 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-navy">{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex items-center justify-center text-primary-300 text-sm">
      Not enough data yet
    </div>
  );
}
