import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const PIPELINE_STEPS = [
    { key: 'auth', label: 'Auth' },
    { key: 'upload', label: 'Upload' },
    { key: 'preprocess', label: 'Preprocess' },
    { key: 'ocr', label: 'OCR' },
    { key: 'entities', label: 'Entities' },
    { key: 'normalize', label: 'Normalize' },
    { key: 'interactions', label: 'Interactions' },
    { key: 'risk', label: 'Risk Score' },
    { key: 'report', label: 'Reporting' },
    { key: 'analytics', label: 'Analytics' },
];

/**
 * PipelineStepper – Displays the 10-step AI pipeline.
 * @param {string} activeStep – key of the currently active step.
 * @param {string[]} completedSteps – array of completed step keys.
 * @param {'horizontal'|'vertical'} direction – layout direction.
 */
export default function PipelineStepper({
    activeStep = '',
    completedSteps = [],
    direction = 'horizontal',
}) {
    const isVertical = direction === 'vertical';

    return (
        <div className={`flex ${isVertical ? 'flex-col gap-3' : 'items-center gap-0 overflow-x-auto pb-2'}`}>
            {PIPELINE_STEPS.map((step, idx) => {
                const isCompleted = completedSteps.includes(step.key);
                const isActive = step.key === activeStep;
                const isPending = !isCompleted && !isActive;

                return (
                    <div key={step.key} className={`flex ${isVertical ? 'items-start gap-3' : 'items-center'}`}>
                        {/* Step indicator */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${isCompleted ? 'bg-primary-500 text-white' : ''}
                  ${isActive ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500 ring-offset-2' : ''}
                  ${isPending ? 'bg-slate-100 text-slate-400' : ''}
                `}
                            >
                                {isCompleted ? (
                                    <CheckCircle2 size={16} />
                                ) : isActive ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <span>{idx + 1}</span>
                                )}
                            </div>
                            <span
                                className={`mt-1 text-[10px] font-semibold text-center whitespace-nowrap
                  ${isCompleted ? 'text-primary-600' : ''}
                  ${isActive ? 'text-primary-700 font-bold' : ''}
                  ${isPending ? 'text-slate-400' : ''}
                `}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector line */}
                        {idx < PIPELINE_STEPS.length - 1 && !isVertical && (
                            <div
                                className={`h-0.5 w-6 mx-1 rounded transition-colors ${isCompleted ? 'bg-primary-400' : 'bg-slate-200'
                                    }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export { PIPELINE_STEPS };
