import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  FiSearch, FiFilter, FiFileText, FiAlertTriangle,
  FiCheckCircle, FiXCircle, FiClock, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

const LEVEL_BADGE = {
  safe:     'bg-emerald-100 text-emerald-800',
  low:      'bg-sky-100 text-sky-800',
  moderate: 'bg-amber-100 text-amber-800',
  high:     'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const PIPELINE_ICON = {
  completed: <FiCheckCircle className="text-emerald-500" size={15} />,
  partial:   <FiAlertTriangle className="text-amber-500" size={15} />,
  failed:    <FiXCircle className="text-red-500" size={15} />,
  processing:<FiClock className="text-sky-500" size={15} />,
};

const PAGE_SIZE = 10;

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.3 } }),
};

export default function HistoryTab({ prescriptions = [] }) {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [page, setPage] = useState(0);

  const filtered = prescriptions.filter((p) => {
    const matchSearch =
      !search ||
      p.prescriptionId?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'all' || p.riskLevel === filterLevel;
    return matchSearch && matchLevel;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass-card rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={15} />
          <input
            type="text"
            placeholder="Search by ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter size={14} className="text-primary-400" />
          <select
            value={filterLevel}
            onChange={(e) => { setFilterLevel(e.target.value); setPage(0); }}
            className="glass-input rounded-xl px-3 py-2 text-sm outline-none text-primary-700"
          >
            <option value="all">All Risk Levels</option>
            {['safe', 'low', 'moderate', 'high', 'critical'].map((l) => (
              <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl p-0 overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FiFileText className="text-primary-300" size={36} />
            <p className="text-primary-400 text-sm">No prescriptions found</p>
            <Link href="/upload" className="text-accent-600 text-sm hover:underline">Upload your first prescription →</Link>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/30">
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-6 py-3">Prescription ID</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Drugs</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Risk</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Pipeline</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p, i) => (
                    <motion.tr
                      key={p.prescriptionId}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-b border-white/20 last:border-0 hover:bg-white/30 transition-colors"
                    >
                      <td className="px-6 py-3 font-mono text-navy font-medium text-xs">{p.prescriptionId}</td>
                      <td className="px-4 py-3 text-primary-600">{p.drugCount ?? '—'}</td>
                      <td className="px-4 py-3">
                        {p.riskLevel ? (
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', LEVEL_BADGE[p.riskLevel])}>
                            {p.riskScore != null ? `${p.riskScore} · ` : ''}{p.riskLevel}
                          </span>
                        ) : <span className="text-primary-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs text-primary-600">
                          {PIPELINE_ICON[p.pipelineStatus] || <FiClock className="text-primary-300" size={15} />}
                          {p.pipelineStatus || p.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Link href={`/results/${p.prescriptionId}`}
                          className="text-xs text-accent-600 hover:text-accent-700 font-medium hover:underline"
                        >
                          View →
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-white/20">
              {paged.map((p, i) => (
                <motion.div
                  key={p.prescriptionId}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className="p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs font-medium text-navy">{p.prescriptionId}</span>
                    {p.riskLevel && (
                      <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', LEVEL_BADGE[p.riskLevel])}>
                        {p.riskLevel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-primary-500">
                    <span>{p.drugCount ?? 0} drugs</span>
                    <span className="flex items-center gap-1">
                      {PIPELINE_ICON[p.pipelineStatus]}
                      {p.pipelineStatus || 'unknown'}
                    </span>
                    <span className="ml-auto text-primary-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link href={`/results/${p.prescriptionId}`}
                    className="mt-2 inline-block text-xs text-accent-600 font-medium hover:underline"
                  >
                    View Results →
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between glass-card rounded-xl px-4 py-2.5">
          <span className="text-xs text-primary-400">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft size={16} className="text-primary-600" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={clsx(
                  'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                  i === page ? 'bg-accent-500 text-white' : 'hover:bg-white/40 text-primary-600'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronRight size={16} className="text-primary-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
