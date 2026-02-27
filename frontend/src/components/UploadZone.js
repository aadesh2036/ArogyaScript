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
      className={`glass-card rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all border-2 border-dashed ${
        isDragActive
          ? 'border-accent-400 bg-accent-50/30 scale-[1.01]'
          : 'border-white/40 hover:border-accent-300 hover:shadow-card-hover'
      } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl glass-btn mx-auto mb-4 flex items-center justify-center">
        <FiUploadCloud className="text-white" size={24} />
      </div>
      {loading ? (
        <>
          <p className="text-primary-700 font-medium text-sm sm:text-base">Analyzing prescription...</p>
          <div className="mt-3 flex justify-center"><div className="w-6 h-6 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" /></div>
        </>
      ) : isDragActive ? (
        <p className="text-accent-600 font-semibold text-base sm:text-lg">Drop the image here</p>
      ) : (
        <>
          <p className="text-primary-700 font-medium text-base sm:text-lg">Drag & drop a prescription image</p>
          <p className="text-xs sm:text-sm text-primary-500/60 mt-2">or click to select (JPEG, PNG, WebP — max 10 MB)</p>
        </>
      )}
    </div>
  );
}
