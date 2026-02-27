import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { FiCrop, FiImage, FiChevronRight, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

const STATUS_BADGE = {
  success:          { label: 'Auto-Cropped', icon: FiCheckCircle, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  fallback_original:{ label: 'Original Used', icon: FiAlertCircle, cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  pending:          { label: 'Pending',       icon: FiImage,       cls: 'bg-white/50 text-primary-400 border-primary-200' },
};

function ImgWithSkeleton({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={clsx('relative overflow-hidden bg-white/20 rounded-xl', className)}>
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/10 via-white/30 to-white/10 rounded-xl" />
      )}
      {/* Broken image fallback */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-primary-300 gap-1.5">
          <FiImage size={28} />
          <span className="text-xs">Image unavailable</span>
        </div>
      )}
      {/* Actual image */}
      {!error && (
        <motion.img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={loaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full h-full object-contain"
          style={{ visibility: loaded ? 'visible' : 'hidden' }}
        />
      )}
    </div>
  );
}

export default function PreprocessingCard({ data }) {
  const {
    originalImagePath,
    croppedImagePath,
    imagePath,
    originalImageUrl,
    croppedImageUrl,
    cropStatus = 'pending',
  } = data || {};

  const [compare, setCompare] = useState(false);
  const sliderRef = useRef(null);
  const [sliderPos, setSliderPos] = useState(50);

  // Prefer Cloudinary URLs; fall back to local /uploads/ paths
  const imgFile = originalImagePath || imagePath;
  const originalUrl = originalImageUrl || (imgFile ? `${API_BASE}/uploads/${imgFile}` : null);
  const croppedUrl  = croppedImageUrl  || (croppedImagePath ? `${API_BASE}/uploads/${croppedImagePath}` : null);

  const badge = STATUS_BADGE[cropStatus] || STATUS_BADGE.pending;
  const BadgeIcon = badge.icon;
  const hasCrop = cropStatus === 'success' && croppedUrl;

  // Slider drag handler
  const handleSliderMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  };

  if (!originalUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/20">
        <div className="flex items-center gap-2">
          <FiCrop className="text-accent-500" size={18} />
          <h3 className="font-semibold text-navy text-sm sm:text-base">Preprocessing</h3>
        </div>
        <span className={clsx('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium', badge.cls)}>
          <BadgeIcon size={13} />
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6">
        {hasCrop ? (
          <>
            {/* Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setCompare(false)}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  !compare ? 'bg-accent-500 text-white' : 'bg-white/30 text-primary-500 hover:bg-white/50'
                )}
              >
                Side by Side
              </button>
              <button
                onClick={() => setCompare(true)}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  compare ? 'bg-accent-500 text-white' : 'bg-white/30 text-primary-500 hover:bg-white/50'
                )}
              >
                Slider Compare
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!compare ? (
                /* ── Side-by-side ── */
                <motion.div
                  key="sidebyside"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="space-y-2">
                    <p className="text-xs text-primary-400 font-medium uppercase tracking-wider">Original</p>
                    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <ImgWithSkeleton
                        src={originalUrl}
                        alt="Original prescription"
                        className="h-48 sm:h-56"
                      />
                    </motion.div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-primary-400 font-medium uppercase tracking-wider flex items-center gap-1">
                      Cropped <FiChevronRight size={11} className="text-emerald-500" />
                    </p>
                    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <ImgWithSkeleton
                        src={croppedUrl}
                        alt="Cropped prescription"
                        className="h-48 sm:h-56"
                      />
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                /* ── Slider compare ── */
                <motion.div
                  key="slider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={sliderRef}
                  className="relative h-56 sm:h-72 rounded-xl overflow-hidden cursor-col-resize select-none touch-none"
                  onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)}
                  onTouchMove={handleSliderMove}
                  onMouseDown={handleSliderMove}
                >
                  {/* Full original underneath */}
                  <img src={originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain" />
                  {/* Cropped clipped to slider position */}
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                    <img
                      src={croppedUrl}
                      alt="Cropped"
                      className="w-full h-full object-contain"
                      style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
                    />
                  </div>
                  {/* Slider handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg"
                    style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                      <FiChevronRight size={10} className="text-primary-500 -mr-0.5" />
                      <FiChevronRight size={10} className="text-primary-500 rotate-180 -ml-0.5" />
                    </div>
                  </div>
                  {/* Labels */}
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full">
                    Cropped
                  </span>
                  <span className="absolute bottom-2 right-2 text-[10px] bg-black/40 text-white px-2 py-0.5 rounded-full">
                    Original
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs text-primary-400/70 mt-3 text-center">
              Auto-cropped — OCR runs on both original &amp; cropped for maximum text extraction
            </p>
          </>
        ) : (
          /* ── Fallback: original only ── */
          <div className="space-y-3">
            <motion.div whileHover={{ scale: 1.015 }} transition={{ type: 'spring', stiffness: 300 }}>
              <ImgWithSkeleton
                src={originalUrl}
                alt="Original prescription"
                className="h-48 sm:h-64 mx-auto max-w-md"
              />
            </motion.div>
            <p className="text-xs text-primary-400/60 text-center">
              {cropStatus === 'fallback_original'
                ? 'Document cropping was skipped — original image used for analysis'
                : 'Preprocessing pending…'}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
