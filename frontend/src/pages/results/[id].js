import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PipelineProgress from '@/components/PipelineProgress';
import ResultCard from '@/components/ResultCard';
import api, { pollPipelineStatus } from '@/lib/api';

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get(`/prescriptions/${id}`);
        const prescription = res.data.data;

        if (!cancelled) {
          setData(prescription);
          setPipelineStatus(prescription.pipelineStatus);
        }

        // If still processing, poll for updates
        if (prescription.status === 'processing') {
          setIsPolling(true);
          await pollPipelineStatus(id, (status) => {
            if (!cancelled) setPipelineStatus(status.pipelineStatus);
          });

          // Fetch final result
          if (!cancelled) {
            const finalRes = await api.get(`/prescriptions/${id}`);
            setData(finalRes.data.data);
            setPipelineStatus(finalRes.data.data.pipelineStatus);
            setIsPolling(false);
          }
        }
      } catch {
        if (!cancelled) router.push('/dashboard');
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  return (
    <Layout title="Analysis Result">
      {data ? (
        <ResultCard data={data} />
      ) : (
        <div className="text-center mt-10">
          {isPolling && pipelineStatus ? (
            <div className="max-w-lg mx-auto">
              <p className="text-gray-500 mb-4">Analysis in progress...</p>
              <PipelineProgress status={pipelineStatus} />
            </div>
          ) : (
            <p className="text-gray-400">Loading...</p>
          )}
        </div>
      )}
    </Layout>
  );
}
