import { motion } from 'framer-motion';
import clsx from 'clsx';
import { FiCheckCircle, FiXCircle, FiLoader, FiClock } from 'react-icons/fi';

const STEPS = [
  { key: 'preprocessing', label: 'YOLO Document Crop', optional: true },
  { key: 'ocr', label: 'OCR Text Extraction' },
  { key: 'structuring', label: 'Drug Entity Extraction' },
  { key: 'anomaly', label: 'Anomaly Detection' },
  { key: 'intervention', label: 'Intervention Analysis' },
  { key: 'gemini', label: 'AI Reasoning', optional: true },
];

const STATUS_ICON = {
  success: <FiCheckCircle className="text-emerald-500" size={20} />,
  failed: <FiXCircle className="text-red-500" size={20} />,
  skipped: <FiClock className="text-primary-400" size={20} />,
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function PipelineProgress({ status }) {
  if (!status) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-navy">Pipeline Progress</h4>
        <span className={clsx('text-xs px-2.5 py-1 rounded-full font-semibold', {
          'bg-emerald-100 text-emerald-800': status.overall === 'completed',
          'bg-amber-100 text-amber-800': status.overall === 'partial',
          'bg-red-100 text-red-800': status.overall === 'failed',
          'bg-sky-100 text-sky-800': !['completed', 'partial', 'failed'].includes(status.overall),
        })}>
          {status.overall?.toUpperCase() || 'PROCESSING'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-primary-100/60 mb-5 overflow-hidden">
        <motion.div
          className={clsx('h-full rounded-full', {
            'bg-emerald-500': status.overall === 'completed',
            'bg-amber-500': status.overall === 'partial',
            'bg-red-500': status.overall === 'failed',
            'bg-accent-500': !['completed', 'partial', 'failed'].includes(status.overall),
          })}
          initial={{ width: '0%' }}
          animate={{
            width: (() => {
              const done = STEPS.filter(s => ['success', 'failed'].includes(status[s.key]?.status)).length;
              return `${Math.round((done / STEPS.length) * 100)}%`;
            })(),
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <motion.div
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {STEPS.map(({ key, label, optional }) => {
          const step = status[key];
          const stepStatus = step?.status || 'skipped';
          const isRunning = stepStatus === 'skipped' && status.overall === 'processing';

          return (
            <motion.div
              key={key}
              variants={rowVariants}
              className={clsx(
                'flex items-center gap-3 py-2 px-3 rounded-xl transition-colors duration-200',
                stepStatus === 'success' && 'bg-emerald-50/40',
                stepStatus === 'failed' && !optional && 'bg-red-50/40',
                stepStatus === 'failed' && optional && 'bg-amber-50/40',
                isRunning && 'bg-accent-50/30',
              )}
            >
              {isRunning ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <FiLoader className={optional ? 'text-purple-400' : 'text-accent-500'} size={20} />
                </motion.div>
              ) : (
                STATUS_ICON[stepStatus] || <FiClock className="text-primary-300" size={20} />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-navy">
                  {label}
                  {optional && (
                    <span className="ml-2 text-xs text-purple-500 font-normal">(AI layer)</span>
                  )}
                </p>
                {step?.error && (
                  <p className={clsx('text-xs mt-0.5', optional ? 'text-amber-500' : 'text-red-500')}>
                    {optional ? '⚠ ' : ''}{step.error}
                  </p>
                )}
                {step?.durationMs > 0 && (
                  <p className="text-xs text-primary-400/60 mt-0.5">{step.durationMs}ms</p>
                )}
              </div>
              <span className={clsx('text-xs font-medium', {
                'text-emerald-600': stepStatus === 'success',
                'text-red-600': stepStatus === 'failed' && !optional,
                'text-amber-500': stepStatus === 'failed' && optional,
                'text-accent-500': isRunning,
                'text-primary-400': stepStatus === 'skipped' && !isRunning,
              })}>
                {isRunning ? 'Running...' : stepStatus}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
