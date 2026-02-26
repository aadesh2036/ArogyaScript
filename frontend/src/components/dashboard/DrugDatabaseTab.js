import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { FiSearch, FiPackage } from 'react-icons/fi';

const rowVars = {
  hidden: { opacity: 0, x: -8 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.03, duration: 0.3 } }),
};

const FREQ_BADGE = (count) => {
  if (count >= 10) return 'bg-red-100 text-red-700';
  if (count >= 5)  return 'bg-amber-100 text-amber-700';
  if (count >= 2)  return 'bg-sky-100 text-sky-700';
  return 'bg-emerald-100 text-emerald-700';
};

export default function DrugDatabaseTab({ stats = {}, prescriptions = [] }) {
  const [search, setSearch] = useState('');

  /* Combine stats.commonDrugs + per-prescription drug entities */
  const drugs = useMemo(() => {
    const map = {};
    // from stats API
    (stats.commonDrugs || []).forEach((d) => {
      const name = (d._id || d.name || '').trim();
      if (!name) return;
      map[name.toLowerCase()] = { name, count: d.count || d.frequency || 1, sources: [] };
    });
    // from prescription drug entities
    prescriptions.forEach((p) => {
      const entities = p.drugEntities || p.structuredData?.drugEntities || [];
      entities.forEach((e) => {
        const name = (e.normalizedName || e.name || '').trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (map[key]) {
          map[key].count = Math.max(map[key].count, 1);
          map[key].dosages = map[key].dosages || [];
          if (e.dosage && !map[key].dosages.includes(e.dosage)) map[key].dosages.push(e.dosage);
        } else {
          map[key] = { name, count: 1, dosages: e.dosage ? [e.dosage] : [] };
        }
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [stats, prescriptions]);

  const filtered = useMemo(
    () => drugs.filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase())),
    [drugs, search]
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="glass-card rounded-2xl p-3 sm:p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={15} />
          <input
            type="text"
            placeholder="Search drugs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-sm outline-none"
          />
        </div>
      </div>

      {/* Drug table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FiPackage className="text-primary-200" size={40} />
            <p className="text-primary-400 text-sm">{search ? 'No drugs match your search' : 'No drug data available yet'}</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/30">
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-6 py-3">#</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Drug Name</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Appearances</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Dosages Seen</th>
                    <th className="text-left text-xs font-semibold text-primary-400/70 uppercase tracking-wider px-4 py-3">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((drug, i) => (
                    <motion.tr
                      key={drug.name}
                      custom={i}
                      variants={rowVars}
                      initial="hidden"
                      animate="visible"
                      className="border-b border-white/20 last:border-0 hover:bg-white/20 transition-colors"
                    >
                      <td className="px-6 py-3 text-primary-300 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-navy">{drug.name}</td>
                      <td className="px-4 py-3 text-primary-600">{drug.count}</td>
                      <td className="px-4 py-3">
                        {drug.dosages?.length > 0
                          ? <div className="flex flex-wrap gap-1">{drug.dosages.map((d) => (
                              <span key={d} className="text-[10px] bg-white/50 text-primary-600 px-1.5 py-0.5 rounded">{d}</span>
                            ))}</div>
                          : <span className="text-primary-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', FREQ_BADGE(drug.count))}>
                          {drug.count >= 10 ? 'Very High' : drug.count >= 5 ? 'High' : drug.count >= 2 ? 'Moderate' : 'Low'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="sm:hidden divide-y divide-white/20">
              {filtered.map((drug, i) => (
                <motion.div key={drug.name} custom={i} variants={rowVars} initial="hidden" animate="visible" className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-navy text-sm">{drug.name}</span>
                    <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', FREQ_BADGE(drug.count))}>
                      ×{drug.count}
                    </span>
                  </div>
                  {drug.dosages?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {drug.dosages.map((d) => (
                        <span key={d} className="text-[10px] bg-white/50 text-primary-500 px-1.5 py-0.5 rounded">{d}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-primary-300 text-right">{filtered.length} drug{filtered.length !== 1 ? 's' : ''} total</p>
    </div>
  );
}
