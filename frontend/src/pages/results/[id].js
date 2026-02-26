import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import PipelineProgress from '@/components/PipelineProgress';
import ResultCard from '@/components/ResultCard';
import PreprocessingCard from '@/components/PreprocessingCard';
import LottiePlayer from '@/components/LottiePlayer';
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
      <AnimatePresence mode="wait">
        {data ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="space-y-6">
              <PreprocessingCard data={data} />
              <ResultCard data={data} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-10"
          >
            {isPolling && pipelineStatus ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-lg mx-auto"
              >
                <div className="flex flex-col items-center gap-3 mb-6">
                  <LottiePlayer name="scan" size={56} autoplay loop />
                  <p className="text-primary-500 font-medium">Analyzing prescription...</p>
                  <p className="text-xs text-primary-400/60">Pipeline modules running — results will appear below</p>
                </div>
                <PipelineProgress status={pipelineStatus} />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full"
                />
                <p className="text-primary-400">Loading...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
