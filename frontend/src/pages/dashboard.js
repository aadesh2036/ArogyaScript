import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import Layout from '@/components/Layout';
import StatsCards   from '@/components/dashboard/StatsCards';
import RiskChart    from '@/components/dashboard/RiskChart';
import RecentTable  from '@/components/dashboard/RecentTable';
import HistoryTab   from '@/components/dashboard/HistoryTab';
import AnomaliesTab from '@/components/dashboard/AnomaliesTab';
import AnalyticsTab from '@/components/dashboard/AnalyticsTab';
import DrugDatabaseTab from '@/components/dashboard/DrugDatabaseTab';
import SettingsTab  from '@/components/dashboard/SettingsTab';
import api from '@/lib/api';

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'history',    label: 'History' },
  { id: 'anomalies',  label: 'Anomalies' },
  { id: 'analytics',  label: 'Analytics' },
  { id: 'drugs',      label: 'Drug DB' },
  { id: 'settings',   label: 'Settings' },
];

const pageFade = {
  initial:  { opacity: 0, y: 10 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:     { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

export default function DashboardPage() {
  const router = useRouter();
  const activeTab = TABS.find((t) => t.id === router.query.tab)?.id || 'overview';

  const [stats,         setStats]         = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, presRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/prescriptions'),
      ]);
      setStats(statsRes.data.data);
      setPrescriptions(presRes.data.data || []);
    } catch {/* interceptor handles */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const goTab = (id) => {
    const query = id === 'overview' ? {} : { tab: id };
    router.push({ pathname: '/dashboard', query }, undefined, { shallow: true });
  };

  return (
    <Layout title="Dashboard">
      {/* Tab bar */}
      <div className="mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-white/30 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => goTab(tab.id)}
              className={clsx(
                'relative px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-accent-600 bg-white/40'
                  : 'text-primary-400 hover:text-primary-600 hover:bg-white/20'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && activeTab === 'overview' && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="glass-card rounded-2xl h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl h-64" />
            <div className="glass-card rounded-2xl h-64" />
          </div>
        </div>
      )}

      {/* Tab content */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} {...pageFade}>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {stats && <StatsCards stats={stats} />}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {stats && <RiskChart distribution={stats.riskDistribution} />}
                  <RecentTable prescriptions={prescriptions.slice(0, 8)} />
                </div>
              </div>
            )}
            {activeTab === 'history' && (
              <HistoryTab prescriptions={prescriptions} />
            )}
            {activeTab === 'anomalies' && (
              <AnomaliesTab prescriptions={prescriptions} />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsTab prescriptions={prescriptions} stats={stats || {}} />
            )}
            {activeTab === 'drugs' && (
              <DrugDatabaseTab prescriptions={prescriptions} stats={stats || {}} />
            )}
            {activeTab === 'settings' && (
              <SettingsTab />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </Layout>
  );
}
