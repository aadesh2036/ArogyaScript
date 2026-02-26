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
      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
        } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input {...getInputProps()} />
      <FiUploadCloud className="mx-auto text-4xl text-primary-500 mb-3" />
      {loading ? (
        <p className="text-gray-500">Analyzing prescription...</p>
      ) : isDragActive ? (
        <p className="text-primary-600 font-medium">Drop the image here</p>
      ) : (
        <>
          <p className="text-gray-600 font-medium">Drag & drop a prescription image</p>
          <p className="text-sm text-gray-400 mt-1">or click to select (JPEG, PNG, WebP — max 10 MB)</p>
        </>
      )}
    </div>
  );
}
