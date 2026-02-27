import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import clsx from 'clsx';
import { FiAlertTriangle, FiAlertOctagon, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const SEVERITY = {
  critical: { label: 'Critical', icon: <FiAlertOctagon size={15} />, badge: 'bg-red-100 text-red-700 border border-red-200', ring: 'ring-red-200' },
  high:     { label: 'High',     icon: <FiAlertTriangle size={15} />, badge: 'bg-orange-100 text-orange-700 border border-orange-200', ring: 'ring-orange-200' },
  moderate: { label: 'Moderate', icon: <FiAlertTriangle size={15} />, badge: 'bg-amber-100 text-amber-700 border border-amber-200', ring: 'ring-amber-200' },
  low:      { label: 'Low',      icon: <FiInfo size={15} />,          badge: 'bg-sky-100 text-sky-700 border border-sky-200',         ring: 'ring-sky-200' },
};

const ORDER = ['critical', 'high', 'moderate', 'low'];

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

function AnomalyGroup({ severity, items }) {
  const [open, setOpen] = useState(severity === 'critical' || severity === 'high');
  const meta = SEVERITY[severity] || SEVERITY.low;
  return (
    <div className={clsx('glass-card rounded-2xl overflow-hidden ring-1', meta.ring)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 hover:bg-white/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={clsx('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', meta.badge)}>
            {meta.icon}{meta.label}
          </span>
          <span className="text-xs text-primary-400">{items.length} anomal{items.length === 1 ? 'y' : 'ies'}</span>
        </div>
        {open ? <FiChevronUp className="text-primary-400" /> : <FiChevronDown className="text-primary-400" />}
      </button>
      {open && (
        <div className="divide-y divide-white/20">
          {items.map((item, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="px-4 py-3 sm:px-6 sm:py-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{item.type || 'Anomaly'}</p>
                  <p className="text-xs text-primary-500 mt-0.5 line-clamp-2">{item.description}</p>
                  {item.drug && (
                    <span className="mt-1 inline-block text-[10px] bg-white/50 text-primary-600 px-2 py-0.5 rounded-full">
                      {item.drug}
                    </span>
                  )}
                </div>
                <Link
                  href={`/results/${item.prescriptionId}`}
                  className="shrink-0 text-[11px] text-accent-600 font-medium hover:underline"
                >
                  View →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnomaliesTab({ prescriptions = [] }) {
  const grouped = useMemo(() => {
    const map = { critical: [], high: [], moderate: [], low: [] };
    prescriptions.forEach((p) => {
      const anomalies = p.aiAnalysis?.anomalyDetection || p.anomalies || [];
      anomalies.forEach((a) => {
        const sev = (a.severity || 'low').toLowerCase();
        const bucket = map[sev] ? sev : 'low';
        map[bucket].push({ ...a, prescriptionId: p.prescriptionId });
      });
    });
    return map;
  }, [prescriptions]);

  const total = Object.values(grouped).reduce((s, v) => s + v.length, 0);

  if (total === 0) {
    return (
      <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
        <FiAlertTriangle className="text-primary-200" size={48} />
        <p className="text-primary-400 font-medium">No anomalies detected</p>
        <p className="text-primary-300 text-sm">All prescriptions appear clean.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ORDER.map((sev) => {
          const meta = SEVERITY[sev];
          return (
            <div key={sev} className={clsx('glass-card rounded-xl p-3 sm:p-4 ring-1', meta.ring)}>
              <p className="text-xs text-primary-400 mb-1">{meta.label}</p>
              <p className="text-2xl font-bold text-navy">{grouped[sev].length}</p>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        {ORDER.map((sev) =>
          grouped[sev].length > 0 ? (
            <AnomalyGroup key={sev} severity={sev} items={grouped[sev]} />
          ) : null
        )}
      </div>
    </div>
  );
}
