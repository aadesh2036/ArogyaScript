import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ResultCard from '../../components/ResultCard';
import api from '../../lib/api';

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/prescriptions/${id}`);
        setData(res.data.data);
      } catch {
        router.push('/dashboard');
      }
    })();
  }, [id]);

  return (
    <Layout title="Analysis Result">
      {data ? <ResultCard data={data} /> : <p className="text-center mt-10 text-gray-400">Loading...</p>}
    </Layout>
  );
}
