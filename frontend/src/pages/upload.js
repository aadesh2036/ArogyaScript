import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import UploadZone from '@/components/UploadZone';
import PipelineProgress from '@/components/PipelineProgress';
import ResultCard from '@/components/ResultCard';
import api, { pollPipelineStatus } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiImage } from 'react-icons/fi';

export default function UploadPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | uploading | processing | done | error
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleUpload = async (file) => {
    setLoading(true);
    setResult(null);
    setPipelineStatus(null);
    setPhase('uploading');

    // Show local preview of selected image
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Step 1: Upload image — returns immediately with prescriptionId
      const { data } = await api.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const prescriptionId = data.data.prescriptionId;
      setPhase('processing');
      toast.success('Image uploaded! Analyzing...');

      // Step 2: Poll for pipeline completion
      await pollPipelineStatus(prescriptionId, (status) => {
        setPipelineStatus(status.pipelineStatus);
      });

      // Step 3: Fetch full result
      const fullResult = await api.get(`/prescriptions/${prescriptionId}`);
      setResult(fullResult.data.data);
      setPhase('done');
      toast.success('Analysis complete!');
    } catch (err) {
      setPhase('error');
      toast.error(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Upload Prescription">
      <div className="max-w-4xl mx-auto space-y-6">
        <UploadZone onUpload={handleUpload} loading={loading} />

        {/* Local image preview */}
        {previewUrl && phase !== 'idle' && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <FiImage className="text-primary-600" size={18} />
              <h4 className="font-semibold text-navy">Uploaded Image Preview</h4>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/30 shadow-glass max-w-md mx-auto">
              <img src={previewUrl} alt="Uploaded prescription" className="w-full h-auto object-contain max-h-72 bg-white/50" />
            </div>
          </div>
        )}

        {/* Pipeline progress indicator */}
        {phase === 'processing' && pipelineStatus && (
          <PipelineProgress status={pipelineStatus} />
        )}

        {/* Full result card */}
        {result && <ResultCard data={result} />}
      </div>
    </Layout>
  );
}
