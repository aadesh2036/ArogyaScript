/**
 * ExplainabilityCard
 * Renders Gemini reasoning outputs as interactive flip cards.
 * Shows: explainability summary, interaction explanations, anomaly explanations,
 * AI-generated interventions, and uncertainty flags.
 *
 * Props:
 *   geminiReasoning: object (from prescription.geminiReasoning)
 */

import { useState } from 'react';
import { FiCpu, FiAlertCircle, FiActivity, FiShield, FiHelpCircle, FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';

// ── Severity/priority color maps ──
const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-sky-100 text-sky-800 border-sky-200',
  unknown: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PRIORITY_COLORS = {
  urgent: 'bg-red-50 border-red-200 text-red-800',
  high: 'bg-orange-50 border-orange-200 text-orange-800',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-sky-50 border-sky-200 text-sky-800',
};

// ═══════════════════════════════════════════════════════════
// FLIP CARD PRIMITIVE
// ═══════════════════════════════════════════════════════════

/**
 * A card that flips between a "front" summary and "back" detail view on click.
 */
function FlipCard({ front, back, accentClass = 'border-purple-200' }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ perspective: '1000px', minHeight: '120px' }}
      onClick={() => setFlipped((f) => !f)}
      title={flipped ? 'Click to collapse' : 'Click for details'}
    >
      {/* Flip container */}
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <div
          className={`glass-card rounded-xl border ${accentClass} p-4 backface-hidden`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">{front}</div>
            <span className="text-xs text-purple-400 shrink-0 mt-0.5">tap ↔</span>
          </div>
        </div>

        {/* BACK */}
        <div
          className={`glass-card rounded-xl border ${accentClass} p-4 backface-hidden absolute inset-0`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 overflow-auto max-h-48">{back}</div>
            <span className="text-xs text-purple-400 shrink-0 mt-0.5">tap ↔</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════

function GeminiStatusBadge({ status }) {
  const config = {
    success: { label: 'AI Explained', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
    failed: { label: 'AI Fallback', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    skipped: { label: 'AI Skipped', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const { label, cls } = config[status] || config.skipped;

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════

function SummarySection({ summary }) {
  return (
    <div className="glass rounded-xl p-4 border border-purple-100/60">
      <p className="text-sm text-primary-700 leading-relaxed">{summary}</p>
    </div>
  );
}

function InteractionExplanations({ items }) {
  if (!items?.length) return <p className="text-sm text-primary-400 italic">No interactions to explain.</p>;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <FlipCard
          key={i}
          accentClass={`border-l-4 ${
            item.severity === 'critical' ? 'border-red-400' :
            item.severity === 'high' ? 'border-orange-400' :
            item.severity === 'moderate' ? 'border-amber-400' : 'border-sky-400'
          } border-white/30`}
          front={
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-primary-700 text-sm">{item.drugA}</span>
                <span className="text-primary-400 text-xs">↔</span>
                <span className="font-medium text-primary-700 text-sm">{item.drugB}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.unknown}`}>
                  {item.severity}
                </span>
                {item.uncertain && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">uncertain</span>
                )}
              </div>
              <p className="text-xs text-primary-600/80 mt-1 line-clamp-2">{item.mechanism}</p>
            </div>
          }
          back={
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Clinical Significance</p>
                <p className="text-xs text-primary-700">{item.clinical_significance || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Evidence Basis</p>
                <p className="text-xs text-primary-700">{item.evidence_basis || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Mechanism</p>
                <p className="text-xs text-primary-700">{item.mechanism || '—'}</p>
              </div>
            </div>
          }
        />
      ))}
    </div>
  );
}

function AnomalyExplanations({ items }) {
  if (!items?.length) return <p className="text-sm text-primary-400 italic">No anomaly explanations.</p>;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <FlipCard
          key={i}
          accentClass="border-amber-200/60"
          front={
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs px-1.5 py-0.5 bg-white/60 rounded text-primary-700">{item.signal_name}</span>
                {typeof item.score === 'number' && (
                  <span className="text-xs text-primary-400">score: {item.score.toFixed(2)}</span>
                )}
                {item.uncertain && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">uncertain</span>
                )}
              </div>
              <p className="text-xs text-primary-600/80 mt-1 line-clamp-2">{item.clinical_meaning}</p>
            </div>
          }
          back={
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Clinical Meaning</p>
                <p className="text-xs text-primary-700">{item.clinical_meaning || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Suggested Cause</p>
                <p className="text-xs text-primary-700">{item.suggested_cause || '—'}</p>
              </div>
            </div>
          }
        />
      ))}
    </div>
  );
}

function GeminiInterventions({ items }) {
  if (!items?.length) return <p className="text-sm text-primary-400 italic">No AI-generated interventions.</p>;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <FlipCard
          key={i}
          accentClass={`border-l-4 ${
            item.priority === 'urgent' ? 'border-red-400' :
            item.priority === 'high' ? 'border-orange-400' :
            item.priority === 'medium' ? 'border-amber-400' : 'border-sky-400'
          } border-white/30`}
          front={
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.low}`}>
                  {item.priority?.toUpperCase()}
                </span>
                <span className="text-xs text-primary-500 font-mono">{item.action_type}</span>
              </div>
              <p className="text-xs text-primary-700 mt-1 line-clamp-2">{item.message}</p>
            </div>
          }
          back={
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Action</p>
                <p className="text-xs text-primary-700">{item.message}</p>
              </div>
              {item.evidence && (
                <div>
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-0.5">Evidence</p>
                  <p className="text-xs text-primary-700">{item.evidence}</p>
                </div>
              )}
              {item.related_drugs?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.related_drugs.map((drug, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 bg-white/50 rounded-full text-primary-600">{drug}</span>
                  ))}
                </div>
              )}
            </div>
          }
        />
      ))}
    </div>
  );
}

function UncertaintyFlags({ items }) {
  if (!items?.length) return <p className="text-sm text-primary-400 italic">No uncertainty flags.</p>;

  return (
    <div className="space-y-2">
      {items.map((flag, i) => (
        <div key={i} className="glass rounded-xl p-3 border border-amber-200/60 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-1">
            <FiHelpCircle size={14} className="text-amber-600 shrink-0" />
            <span className="text-xs font-mono text-amber-800">{flag.field}</span>
          </div>
          <p className="text-xs text-amber-700">{flag.reason}</p>
          {flag.impact && (
            <p className="text-xs text-amber-600/80 mt-1 italic">Impact: {flag.impact}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ExplainabilityCard({ geminiReasoning }) {
  const [expandedSection, setExpandedSection] = useState('summary');

  if (!geminiReasoning) return null;

  const {
    explainability_summary,
    interaction_explanations = [],
    anomaly_explanations = [],
    interventions = [],
    uncertainty_flags = [],
    gemini_status,
    reasoning_version,
    durationMs,
  } = geminiReasoning;

  const isFailed = gemini_status === 'failed' || gemini_status === 'skipped';

  const tabs = [
    { key: 'summary', label: 'Summary', icon: <FiCpu size={14} /> },
    { key: 'interactions', label: `Interactions (${interaction_explanations.length})`, icon: <FiShield size={14} /> },
    { key: 'anomalies', label: `Anomalies (${anomaly_explanations.length})`, icon: <FiAlertCircle size={14} /> },
    { key: 'interventions', label: `AI Actions (${interventions.length})`, icon: <FiActivity size={14} /> },
    { key: 'uncertainty', label: `Uncertainty (${uncertainty_flags.length})`, icon: <FiHelpCircle size={14} /> },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-purple-100/40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-purple-100/60 flex items-center justify-center">
          <FiCpu className="text-purple-600" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-navy">Gemini AI Explainability</h4>
          <p className="text-xs text-primary-500/60 mt-0.5">
            {reasoning_version || 'gemini_reasoning_v1'}
            {durationMs ? ` · ${durationMs}ms` : ''}
          </p>
        </div>
        <GeminiStatusBadge status={gemini_status} />
      </div>

      {/* Fallback notice */}
      {isFailed && (
        <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800">
          <FiInfo size={14} className="shrink-0 mt-0.5" />
          <span>
            Gemini API was unavailable. Explanations below were generated from rule-based fallback templates — less context-aware than live AI analysis.
          </span>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex gap-1 flex-wrap mb-4 p-1 glass rounded-xl">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setExpandedSection(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              expandedSection === key
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-primary-600 hover:bg-white/40'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[80px]">
        {expandedSection === 'summary' && (
          <SummarySection summary={explainability_summary || 'No summary available.'} />
        )}
        {expandedSection === 'interactions' && (
          <InteractionExplanations items={interaction_explanations} />
        )}
        {expandedSection === 'anomalies' && (
          <AnomalyExplanations items={anomaly_explanations} />
        )}
        {expandedSection === 'interventions' && (
          <GeminiInterventions items={interventions} />
        )}
        {expandedSection === 'uncertainty' && (
          <UncertaintyFlags items={uncertainty_flags} />
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-primary-400/50 mt-4 border-t border-white/20 pt-3">
        AI-generated explanations are for clinical decision support only and must not replace professional medical judgment. Flip cards show front summary / back detail.
      </p>
    </div>
  );
}
