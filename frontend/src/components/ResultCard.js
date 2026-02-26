import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import PipelineProgress from './PipelineProgress';
import ExplainabilityCard from './ExplainabilityCard';
import DrugFlipCard from './DrugFlipCard';
import LottiePlayer from './LottiePlayer';
import { FiImage, FiAlertTriangle, FiShield, FiActivity, FiClipboard } from 'react-icons/fi';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const SEVERITY_COLORS = {
  safe: 'bg-emerald-100 text-emerald-800',
  low: 'bg-sky-100 text-sky-800',
  moderate: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS = {
  urgent: 'bg-red-50/80 text-red-800 border-red-200/60',
  high: 'bg-orange-50/80 text-orange-800 border-orange-200/60',
  medium: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
  low: 'bg-sky-50/80 text-sky-800 border-sky-200/60',
};

const FLAG_SEVERITY_COLORS = {
  critical: 'bg-red-50/80 border-red-200/60 text-red-800',
  warning: 'bg-amber-50/80 border-amber-200/60 text-amber-800',
  info: 'bg-sky-50/80 border-sky-200/60 text-sky-800',
};

// ── Animation variants ──
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

/**
 * Derive per-drug risk level from anomalyFlags + interactions
 */
function deriveDrugRisk(drugName, anomalyFlags = [], interactions = []) {
  const flags = anomalyFlags.filter((f) => f.drugName?.toLowerCase() === drugName?.toLowerCase());
  const inters = interactions.filter(
    (i) => i.drug1?.toLowerCase() === drugName?.toLowerCase() || i.drug2?.toLowerCase() === drugName?.toLowerCase()
  );
  const hasCriticalFlag = flags.some((f) => f.severity === 'critical');
  const hasWarningFlag = flags.some((f) => f.severity === 'warning');
  const hasCriticalInter = inters.some((i) => i.severity === 'critical' || i.severity === 'high');
  const hasModeInter = inters.some((i) => i.severity === 'moderate');

  if (hasCriticalFlag || hasCriticalInter) return 'critical';
  if (hasWarningFlag || hasModeInter) return 'moderate';
  if (inters.length > 0) return 'low';
  return 'safe';
}

export default function ResultCard({ data }) {
  const {
    prescriptionId, extractedEntities, interactions, riskScore,
    metadata, ocrText, anomalyFlags, interventions, pipelineStatus,
    imagePath, processedImagePath, geminiReasoning,
  } = data;

  const imageUrl = imagePath ? `${API_BASE}/uploads/${imagePath.replace(/^uploads[\\/]/, '')}` : null;
  const processedUrl = processedImagePath ? `${API_BASE}/uploads/${processedImagePath.replace(/^uploads[\\/]/, '')}` : null;

  // ── Gemini explanation look-ups ──
  const interactionExps = geminiReasoning?.interaction_explanations || [];
  const anomalyExps = geminiReasoning?.anomaly_explanations || [];
  const geminiInterventions = geminiReasoning?.interventions || [];

  // ── Build per-drug data maps ──
  const drugMeta = useMemo(() => {
    if (!extractedEntities) return [];
    return extractedEntities.map((entity) => {
      const name = entity.drugName?.toLowerCase();
      return {
        entity,
        riskLevel: deriveDrugRisk(entity.drugName, anomalyFlags, interactions),
        interactions: (interactions || []).filter(
          (i) => i.drug1?.toLowerCase() === name || i.drug2?.toLowerCase() === name
        ),
        interactionExplanations: interactionExps.filter(
          (e) => e.drugA?.toLowerCase() === name || e.drugB?.toLowerCase() === name
        ),
        anomalyExplanations: anomalyExps.filter(
          (e) => e.signal_name?.toLowerCase().includes(name)
        ),
        interventions: geminiInterventions.filter(
          (iv) => iv.related_drugs?.some((d) => d.toLowerCase() === name)
        ),
      };
    });
  }, [extractedEntities, anomalyFlags, interactions, interactionExps, anomalyExps, geminiInterventions]);

  // ── Risk badge lottie ──
  const riskLottie = riskScore?.level === 'critical' || riskScore?.level === 'high' ? 'alert' : 'safe';

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Header ─── */}
      <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-navy truncate">
            Prescription {prescriptionId}
          </h3>
          <p className="text-xs sm:text-sm text-primary-500/60">
            {metadata?.ocrEngine} — {metadata?.processingTimeMs}ms
          </p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <LottiePlayer name={riskLottie} size={32} autoplay loop />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-navy">{riskScore?.overall ?? '—'}</div>
            <span className={clsx('risk-badge text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold', SEVERITY_COLORS[riskScore?.level] || 'bg-gray-100 text-gray-600')}>
              {riskScore?.level?.toUpperCase() || 'PENDING'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Images ─── */}
      <AnimatePresence>
        {(imageUrl || processedUrl) && (
          <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiImage className="text-accent-600" size={18} />
              <h4 className="font-semibold text-navy text-sm sm:text-base">Prescription Images</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {imageUrl && (
                <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-medium text-primary-600/60 mb-2 uppercase tracking-wide">Original Image</p>
                  <div className="rounded-xl overflow-hidden border border-white/30 shadow-glass">
                    <img src={imageUrl} alt="Original prescription" className="w-full h-auto object-contain max-h-80 bg-white/50" />
                  </div>
                </motion.div>
              )}
              {processedUrl && (
                <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                  <p className="text-xs font-medium text-primary-600/60 mb-2 uppercase tracking-wide">Processed Image</p>
                  <div className="rounded-xl overflow-hidden border border-white/30 shadow-glass">
                    <img src={processedUrl} alt="Processed prescription" className="w-full h-auto object-contain max-h-80 bg-white/50" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Pipeline Status ─── */}
      {pipelineStatus && (
        <motion.div variants={sectionVariants}>
          <PipelineProgress status={pipelineStatus} />
        </motion.div>
      )}

      {/* ─── OCR Text ─── */}
      {ocrText && (
        <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <FiClipboard className="text-accent-600" size={18} />
            <h4 className="font-semibold text-navy text-sm sm:text-base">OCR Extracted Text</h4>
          </div>
          <pre className="glass rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-primary-700 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto custom-scrollbar break-all">
            {ocrText}
          </pre>
          {data.ocrConfidence != null && (
            <p className="text-xs text-primary-500/50 mt-2">
              Confidence: {(data.ocrConfidence * 100).toFixed(0)}%
            </p>
          )}
        </motion.div>
      )}

      {/* ─── Drug Flip Cards ─── */}
      {drugMeta.length > 0 && (
        <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <FiActivity className="text-accent-600" size={18} />
            <h4 className="font-semibold text-navy text-sm sm:text-base">Extracted Medications</h4>
            <span className="hidden sm:inline text-xs text-primary-400 ml-auto">Tap cards to explain</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {drugMeta.map((dm, i) => (
              <DrugFlipCard
                key={dm.entity.drugName + i}
                entity={dm.entity}
                riskLevel={dm.riskLevel}
                interactions={dm.interactions}
                interactionExplanations={dm.interactionExplanations}
                anomalyExplanations={dm.anomalyExplanations}
                interventions={dm.interventions}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── Anomaly Flags ─── */}
      {anomalyFlags?.length > 0 && (
        <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiAlertTriangle className="text-amber-500" size={18} />
            <h4 className="font-semibold text-navy">Anomaly Flags ({anomalyFlags.length})</h4>
          </div>
          <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
            {anomalyFlags.map((flag, i) => (
              <motion.div
                key={i}
                variants={listItemVariants}
                whileHover={{ x: 4 }}
                className={clsx('border rounded-xl p-3 backdrop-blur-sm', FLAG_SEVERITY_COLORS[flag.severity] || 'bg-gray-50/80 border-gray-200/60')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/60">{flag.type}</span>
                  <span className="text-xs font-semibold uppercase">{flag.severity}</span>
                  {flag.drugName && <span className="ml-auto text-xs opacity-70">{flag.drugName}</span>}
                </div>
                <p className="text-sm mt-1">{flag.message}</p>
                {flag.detail && <p className="text-xs mt-1 opacity-75">{flag.detail}</p>}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ─── Interactions ─── */}
      {interactions?.length > 0 && (
        <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FiShield className="text-red-500" size={18} />
            <h4 className="font-semibold text-navy">Drug Interactions</h4>
          </div>
          <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
            {interactions.map((intr, i) => (
              <motion.div
                key={i}
                variants={listItemVariants}
                whileHover={{ scale: 1.01, x: 2 }}
                className="glass rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-navy">{intr.drug1}</span>
                  <span className="text-primary-400">↔</span>
                  <span className="font-medium text-navy">{intr.drug2}</span>
                  <span className={clsx('ml-auto text-xs px-2 py-0.5 rounded-full risk-badge', SEVERITY_COLORS[intr.severity])}>
                    {intr.severity}
                  </span>
                </div>
                <p className="text-sm text-primary-600/70">{intr.description}</p>
                {intr.recommendation && (
                  <p className="text-sm text-accent-700 mt-1 font-medium">→ {intr.recommendation}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ─── Interventions ─── */}
      {interventions?.length > 0 && (
        <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold text-navy mb-4">Clinical Interventions ({interventions.length})</h4>
          <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="visible">
            {interventions.map((iv, i) => (
              <motion.div
                key={i}
                variants={listItemVariants}
                whileHover={{ x: 4, scale: 1.005 }}
                className={clsx('border rounded-xl p-4 backdrop-blur-sm', PRIORITY_COLORS[iv.priority] || 'bg-gray-50/80 border-gray-200/60')}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/60">{iv.type}</span>
                  <span className="text-xs font-bold uppercase">{iv.priority}</span>
                </div>
                <p className="text-sm mt-1">{iv.message}</p>
                {iv.relatedDrugs?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {iv.relatedDrugs.map((drug, j) => (
                      <span key={j} className="text-xs px-2 py-0.5 bg-white/50 rounded-full">{drug}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ─── Risk Signals ─── */}
      {riskScore?.signals?.length > 0 && (
        <motion.div variants={sectionVariants} className="glass-card rounded-2xl p-6">
          <h4 className="font-semibold text-navy mb-4">Risk Signals</h4>
          <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
            {riskScore.signals.map((s, i) => (
              <motion.div
                key={i}
                variants={listItemVariants}
                className="flex items-center justify-between text-sm glass rounded-lg px-3 py-2"
              >
                <span className="text-primary-700">{s.detail}</span>
                <span className="font-mono font-semibold text-accent-700">+{s.weight}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ─── Partial results notice ─── */}
      <AnimatePresence>
        {pipelineStatus?.overall === 'partial' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 text-sm text-amber-800 backdrop-blur-sm"
          >
            <strong>Partial Results:</strong> Some pipeline modules failed. Results above may be incomplete.
            Check the Pipeline Progress section for details.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Gemini Explainability ─── */}
      <AnimatePresence>
        {geminiReasoning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <ExplainabilityCard geminiReasoning={geminiReasoning} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
