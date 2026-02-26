import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud } from 'react-icons/fi';

export default function UploadZone({ onUpload, loading }) {
  const onDrop = useCallback(
    (files) => {
      if (files.length > 0) onUpload(files[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={`glass-card rounded-2xl p-12 text-center cursor-pointer transition-all border-2 border-dashed ${
        isDragActive
          ? 'border-primary-400 bg-primary-50/30 scale-[1.01]'
          : 'border-white/40 hover:border-primary-300 hover:shadow-glass-lg'
      } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="w-16 h-16 rounded-2xl glass-btn mx-auto mb-4 flex items-center justify-center">
        <FiUploadCloud className="text-white" size={28} />
      </div>
      {loading ? (
        <>
          <p className="text-primary-700 font-medium">Analyzing prescription...</p>
          <div className="mt-3 flex justify-center"><div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" /></div>
        </>
      ) : isDragActive ? (
        <p className="text-primary-600 font-semibold text-lg">Drop the image here</p>
      ) : (
        <>
          <p className="text-primary-700 font-medium text-lg">Drag & drop a prescription image</p>
          <p className="text-sm text-primary-500/60 mt-2">or click to select (JPEG, PNG, WebP — max 10 MB)</p>
        </>
      )}
    </div>
  );
}
