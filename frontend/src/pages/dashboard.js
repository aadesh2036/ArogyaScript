import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StatsCards from '../components/dashboard/StatsCards';
import RiskChart from '../components/dashboard/RiskChart';
import RecentTable from '../components/dashboard/RecentTable';
import api from '../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/prescriptions'),
        ]);
        setStats(statsRes.data.data);
        setRecent(recentRes.data.data);
      } catch {
        // handled by interceptor
      }
    })();
  }, []);

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {stats && <StatsCards stats={stats} />}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats && <RiskChart distribution={stats.riskDistribution} />}
          <RecentTable prescriptions={recent} />
        </div>
      </div>
    </Layout>
  );
}
