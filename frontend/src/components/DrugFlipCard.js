/**
 * DrugFlipCard — A 3D flip card for individual drug entities.
 *
 * Front face: drug name, dosage, frequency, risk badge, small Lottie.
 * Back face:  explainability bullets, interactions, interventions.
 *
 * Accessibility:
 *   - Enter/Space flips card
 *   - Esc closes (unflips)
 *   - prefers-reduced-motion → crossfade instead of 3D rotation
 *   - aria-expanded tracks flip state
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import LottiePlayer from './LottiePlayer';

// ── Risk level config ──
const RISK_CONFIG = {
  safe:     { label: 'Safe',     bg: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', lottie: 'safe' },
  low:      { label: 'Low',      bg: 'bg-sky-100 text-sky-800',         dot: 'bg-sky-500',     lottie: 'safe' },
  moderate: { label: 'Moderate', bg: 'bg-amber-100 text-amber-800',     dot: 'bg-amber-500',   lottie: 'scan' },
  high:     { label: 'High',     bg: 'bg-orange-100 text-orange-800',   dot: 'bg-orange-500',  lottie: 'alert' },
  critical: { label: 'Critical', bg: 'bg-red-100 text-red-800',         dot: 'bg-red-500',     lottie: 'alert' },
};

// ── Reduced motion hook ──
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export default function DrugFlipCard({
  entity,                     // { drugName, dosage, frequency, duration, confidence }
  riskLevel = 'safe',         // safe | low | moderate | high | critical
  interactions = [],          // [{ drugA, drugB, severity, mechanism }]
  interactionExplanations = [],// [{ drugA, drugB, mechanism, clinical_significance, evidence_basis }]
  anomalyExplanations = [],   // [{ signal_name, clinical_meaning, suggested_cause }]
  interventions = [],         // [{ priority, action_type, message, evidence }]
  index = 0,                  // for staggered enter animation
}) {
  const [flipped, setFlipped] = useState(false);
  const reducedMotion = useReducedMotion();
  const risk = RISK_CONFIG[riskLevel] || RISK_CONFIG.safe;

  const toggleFlip = useCallback(() => setFlipped((f) => !f), []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFlip();
    } else if (e.key === 'Escape' && flipped) {
      setFlipped(false);
    }
  }, [flipped, toggleFlip]);

  // ── Card content — front ──
  const frontContent = (
    <div className="p-5 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy text-base truncate">{entity?.drugName || 'Unknown Drug'}</h3>
          <p className="text-sm text-primary-600/70 mt-0.5">
            {entity?.dosage || <span className="italic text-amber-500">No dosage</span>}
            {entity?.frequency && <span className="ml-2">· {entity.frequency}</span>}
          </p>
          {entity?.duration && (
            <p className="text-xs text-primary-500/50 mt-1">{entity.duration}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={clsx('risk-badge text-xs px-2.5 py-1 rounded-full font-semibold', risk.bg)}>
            {risk.label}
          </span>
          <LottiePlayer
            name={risk.lottie}
            size={28}
            autoplay={riskLevel === 'high' || riskLevel === 'critical'}
            play={flipped && (riskLevel === 'high' || riskLevel === 'critical')}
          />
        </div>
      </div>

      {/* Quick stats row */}
      <div className="mt-auto pt-3 flex items-center gap-3 text-xs text-primary-500/60">
        {interactions.length > 0 && (
          <span className="flex items-center gap-1">
            <span className={clsx('w-1.5 h-1.5 rounded-full', risk.dot)} />
            {interactions.length} interaction{interactions.length > 1 ? 's' : ''}
          </span>
        )}
        {entity?.confidence != null && (
          <span>OCR: {(entity.confidence * 100).toFixed(0)}%</span>
        )}
        <span className="ml-auto text-[10px] text-primary-400/50">tap to explain →</span>
      </div>
    </div>
  );

  // ── Card content — back ──
  const backContent = (
    <div className="p-5 h-full overflow-y-auto custom-scrollbar space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-navy text-sm">Explainability — {entity?.drugName}</h4>
        <span className={clsx('risk-badge text-[10px] px-2 py-0.5 rounded-full font-medium', risk.bg)}>
          {risk.label}
        </span>
      </div>

      {/* Interaction explanations */}
      {interactionExplanations.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-600 mb-1.5">Interactions</p>
          {interactionExplanations.map((ie, i) => (
            <div key={i} className="mb-2 p-2 rounded-lg bg-primary-50/60 border border-primary-100/50">
              <p className="text-xs font-medium text-navy">
                {ie.drugA} ↔ {ie.drugB}
                {ie.uncertain && <span className="ml-1 text-amber-500 text-[10px]">(uncertain)</span>}
              </p>
              <p className="text-[11px] text-primary-700/80 mt-0.5">{ie.mechanism || ie.clinical_significance}</p>
              {ie.evidence_basis && (
                <p className="text-[10px] text-primary-500/60 mt-0.5 italic">Evidence: {ie.evidence_basis}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Anomaly explanations */}
      {anomalyExplanations.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1.5">Anomalies</p>
          {anomalyExplanations.map((ae, i) => (
            <div key={i} className="mb-1.5 text-xs text-primary-700/80">
              <span className="font-mono text-[10px] bg-amber-50 px-1 rounded mr-1">{ae.signal_name}</span>
              {ae.clinical_meaning}
            </div>
          ))}
        </div>
      )}

      {/* Interventions */}
      {interventions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy mb-1.5">Suggested Actions</p>
          {interventions.slice(0, 3).map((iv, i) => (
            <button
              key={i}
              className={clsx(
                'block w-full text-left text-xs p-2 rounded-lg mb-1 border transition-all',
                'hover:translate-x-0.5 focus:ring-2 focus:ring-accent-500/30 focus:outline-none',
                iv.priority === 'urgent' || iv.priority === 'high'
                  ? 'bg-red-50/60 border-red-200/60 text-red-800'
                  : 'bg-primary-50/60 border-primary-100/50 text-primary-800'
              )}
            >
              <span className="font-medium">{iv.action_type?.replace(/_/g, ' ')}</span>
              <span className="block text-[10px] mt-0.5 opacity-80">{iv.message?.slice(0, 80)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Fallback if nothing to show */}
      {interactionExplanations.length === 0 && anomalyExplanations.length === 0 && interventions.length === 0 && (
        <div className="flex items-center gap-2 py-3 px-3 rounded-lg bg-primary-50/60 border border-primary-100/40">
          <span className="text-xs text-primary-500/70">No advanced explainability data — showing rule-based results.</span>
        </div>
      )}

      <p className="text-[10px] text-primary-400/40 pt-1">Press Esc or tap to flip back</p>
    </div>
  );

  // ── Stagger entrance delay ──
  const enterDelay = index * 0.06;

  // ── REDUCED MOTION: crossfade instead of 3D flip ──
  if (reducedMotion) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: enterDelay, duration: 0.3 }}
        className="glass-card rounded-2xl cursor-pointer focus-within:ring-2 focus-within:ring-accent-500/40"
        style={{ minHeight: 160 }}
        role="button"
        tabIndex={0}
        aria-expanded={flipped}
        aria-label={`${entity?.drugName} drug card. ${flipped ? 'Showing details.' : 'Press enter for details.'}`}
        onClick={toggleFlip}
        onKeyDown={handleKeyDown}
      >
        <AnimatePresence mode="wait">
          {!flipped ? (
            <motion.div key="front" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {frontContent}
            </motion.div>
          ) : (
            <motion.div key="back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {backContent}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── FULL MOTION: 3D preserve-3d flip ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: enterDelay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group cursor-pointer"
      style={{ perspective: 1200, minHeight: 160 }}
      role="button"
      tabIndex={0}
      aria-expanded={flipped}
      aria-label={`${entity?.drugName} drug card. ${flipped ? 'Showing details.' : 'Press enter for details.'}`}
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT FACE */}
        <div
          className={clsx(
            'glass-card rounded-2xl w-full',
            'group-hover:shadow-card-hover group-hover:-translate-y-1 transition-shadow transition-transform duration-300',
          )}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {frontContent}
        </div>

        {/* BACK FACE */}
        <div
          className="glass-card rounded-2xl w-full absolute inset-0 border-accent-500/20"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {backContent}
        </div>
      </motion.div>
    </motion.div>
  );
}
