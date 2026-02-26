import { useState } from 'react';
import Layout from '@/components/Layout';
import UploadZone from '@/components/UploadZone';
import ResultCard from '@/components/ResultCard';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file) => {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Upload Prescription">
      <div className="max-w-4xl mx-auto space-y-8">
        <UploadZone onUpload={handleUpload} loading={loading} />
        {result && <ResultCard data={result} />}
      </div>
    </Layout>
  );
}
