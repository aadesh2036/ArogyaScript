import React, { useState, useEffect } from 'react';
import {
    UploadCloud, Search, Download, FileText, AlertTriangle, ShieldAlert, CheckCircle2,
    RefreshCw, UserCircle, Edit3, Type, Eye, EyeOff, Layers, ArrowRightLeft, Pill
} from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import PipelineStepper from '../components/PipelineStepper';

export default function ProcessingDashboard() {
    const [isProcessing, setIsProcessing] = useState(true);
    const [completedPipelineSteps, setCompletedPipelineSteps] = useState([]);
    const [activePipelineStep, setActivePipelineStep] = useState('preprocess');

    const [processingSteps, setProcessingSteps] = useState([
        { id: 'preprocess', pipelineKey: 'preprocess', label: 'Preprocessing & Quality Check', status: 'pending', detail: 'Crop, deskew, enhance.' },
        { id: 'ocr', pipelineKey: 'ocr', label: 'OCR & Text Extraction', status: 'pending', detail: 'Avg Confidence: 94%' },
        { id: 'entities', pipelineKey: 'entities', label: 'Entity Recognition', status: 'pending', detail: '3 Drugs, 2 Dosages, 1 Duration' },
        { id: 'normalize', pipelineKey: 'normalize', label: 'Drug Name Normalization', status: 'pending', detail: 'Amoxil → Amoxicillin' },
        { id: 'interactions', pipelineKey: 'interactions', label: 'Drug Interaction Reasoning', status: 'pending', detail: '1 Interaction Detected' },
        { id: 'risk', pipelineKey: 'risk', label: 'Risk Scoring', status: 'pending', detail: 'Score: 82/100 | 1 Rule Triggered' },
    ]);

    const [showHighlights, setShowHighlights] = useState(true);
    const [highContrast, setHighContrast] = useState(false);
    const [persona, setPersona] = useState('Pharmacist');
    const [extractedData, setExtractedData] = useState([
        { id: 1, field: 'Drug Name', value: 'Amoxicillin', confidence: 96, isEditing: false },
        { id: 2, field: 'Dose', value: '500 mg', confidence: 92, isEditing: false },
        { id: 3, field: 'Frequency', value: 'Twice daily (BD)', confidence: 85, isEditing: false },
        { id: 4, field: 'Duration', value: '7 days', confidence: 98, isEditing: false },
    ]);

    // Simulated real-time processing (Socket.io placeholder)
    useEffect(() => {
        let currentStep = 0;
        const interval = setInterval(() => {
            setProcessingSteps(prev => {
                const next = [...prev];
                if (currentStep < next.length) {
                    next[currentStep].status = 'complete';
                    setCompletedPipelineSteps(c => [...c, next[currentStep].pipelineKey]);
                    currentStep++;
                    if (currentStep < next.length) {
                        setActivePipelineStep(next[currentStep].pipelineKey);
                    }
                }
                if (currentStep >= next.length) {
                    clearInterval(interval);
                    setActivePipelineStep('');
                    setTimeout(() => setIsProcessing(false), 600);
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleEditChange = (id, newValue) => {
        setExtractedData(prev => prev.map(item => item.id === id ? { ...item, value: newValue } : item));
    };

    const getConfidenceColor = (score) => {
        if (score >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    const themeClasses = highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900';
    const panelClasses = highContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200';

    return (
        <div className={`min-h-screen flex flex-col font-sans ${themeClasses}`}>
            <Head>
                <title>Processing Dashboard | ArogyaScript</title>
            </Head>

            {/* Top Header */}
            <header className={`px-6 py-4 flex items-center justify-between border-b ${highContrast ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-2">
                    <div className="bg-primary-600 text-white p-2 rounded-lg">
                        <Layers size={24} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">ArogyaScript</h1>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium hover:underline text-primary-600">Home</Link>
                    <Link href="/capture" className="text-sm font-medium hover:underline text-primary-600">Capture</Link>
                    <Link href="/analytics" className="text-sm font-medium hover:underline text-primary-600">Analytics</Link>

                    <div className="h-6 w-px bg-slate-300 mx-2" />

                    <div className="flex items-center gap-2">
                        <UserCircle size={20} className="text-slate-500" />
                        <select
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            className={`text-sm border rounded-md py-1 px-2 focus:ring-2 focus:ring-primary-500 outline-none ${highContrast ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'}`}
                        >
                            <option>Pharmacist</option>
                            <option>Doctor</option>
                            <option>Patient</option>
                            <option>Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className={`p-2 rounded-md transition-colors ${highContrast ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'} text-slate-500 hover:text-primary-600`} title="Export JSON">
                            <Download size={20} />
                        </button>
                        <button className={`p-2 rounded-md transition-colors ${highContrast ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'} text-slate-500 hover:text-primary-600`} title="Export PDF">
                            <FileText size={20} />
                        </button>
                        <button
                            onClick={() => setHighContrast(!highContrast)}
                            className={`p-2 rounded-md transition-colors ${highContrast ? 'bg-zinc-800 text-white' : 'hover:bg-slate-100 text-slate-500'}`}
                            title="Toggle High Contrast"
                        >
                            {highContrast ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Pipeline Mini-Stepper */}
            <div className={`px-6 py-3 border-b ${highContrast ? 'border-zinc-800 bg-zinc-950' : 'border-slate-100 bg-white/50'}`}>
                <PipelineStepper
                    activeStep={activePipelineStep}
                    completedSteps={['auth', 'upload', ...completedPipelineSteps]}
                    direction="horizontal"
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                        <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full ${highContrast ? 'bg-zinc-900 border border-zinc-700' : 'bg-white'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <RefreshCw className="animate-spin text-primary-600" size={28} />
                                <h2 className="text-xl font-bold">Processing Document</h2>
                            </div>
                            <div className="space-y-4">
                                {processingSteps.map((step) => (
                                    <div key={step.id} className="flex items-start gap-3 animate-fade-in-up">
                                        <div className="mt-0.5">
                                            {step.status === 'complete' ? (
                                                <div className="bg-emerald-100 text-emerald-600 rounded-full h-6 w-6 flex items-center justify-center">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            ) : (
                                                <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`font-semibold ${step.status === 'complete' ? (highContrast ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>
                                                {step.label}
                                            </p>
                                            {step.status === 'complete' && step.detail && (
                                                <p className="text-sm text-slate-500 mt-0.5">{step.detail}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Split Layout */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full pb-16">

                    {/* Left Panel: Source Doc */}
                    <div className={`rounded-xl border shadow-sm flex flex-col overflow-hidden ${panelClasses}`}>
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${highContrast ? 'border-zinc-700' : 'border-slate-100'}`}>
                            <h3 className="font-semibold flex items-center gap-2">
                                <Search size={18} className="text-slate-400" />
                                Source Document
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowHighlights(!showHighlights)}
                                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${showHighlights ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}
                                >
                                    {showHighlights ? 'Hide Regions' : 'Show Regions'}
                                </button>
                                <button className="text-xs px-3 py-1.5 border border-slate-200 rounded-md font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                                    <UploadCloud size={14} /> Re-upload
                                </button>
                            </div>
                        </div>

                        <div className={`flex-1 relative p-6 flex justify-center items-center overflow-auto ${highContrast ? 'bg-zinc-950' : 'bg-slate-100'}`}>
                            <div className="relative max-w-md w-full aspect-[3/4] bg-white shadow-md rounded-md p-8 select-none">
                                <div className="border-b-2 border-slate-800 pb-4 mb-6">
                                    <h2 className="text-2xl font-serif font-bold text-slate-800">DR. SMITH CLINIC</h2>
                                    <p className="text-sm text-slate-500">123 Health Ave, Medical District</p>
                                    <p className="text-sm text-slate-500">Tel: (555) 123-4567</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Patient Name</p>
                                            <p className="font-medium text-slate-800 text-lg">John Doe</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Date</p>
                                            <p className="font-medium text-slate-800">Oct 24, 2023</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-4xl text-primary-900 font-serif mb-6 opacity-30">℞</p>
                                        <div className="relative mb-6">
                                            <p className="font-mono text-xl text-slate-900 tracking-tight">Amoxicillin 500mg</p>
                                            <p className="font-mono text-slate-700">Take 1 capsule twice daily (BD)</p>
                                            <p className="font-mono text-slate-700">Duration: 7 days</p>
                                            {showHighlights && !isProcessing && (
                                                <>
                                                    <div className="absolute top-0 left-0 w-48 h-8 border-2 border-primary-400 bg-primary-400/20 rounded animate-pulse" />
                                                    <div className="absolute top-0 left-[11.5rem] w-20 h-8 border-2 border-yellow-400 bg-yellow-400/20 rounded animate-pulse" />
                                                    <div className="absolute top-8 left-0 w-64 h-6 border-2 border-emerald-400 bg-emerald-400/20 rounded mt-1" />
                                                    <div className="absolute top-14 left-0 w-36 h-6 border-2 border-purple-400 bg-purple-400/20 rounded mt-2" />
                                                </>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <p className="font-mono text-xl text-slate-900 tracking-tight">Ibuprofen 400mg</p>
                                            <p className="font-mono text-slate-700">Take 1 tablet PRN for pain</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-12 right-12">
                                    <p className="text-slate-400 italic text-2xl">A. Smith</p>
                                    <div className="w-32 border-t border-slate-400 mt-2 text-center text-xs text-slate-500 uppercase">Signature</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="flex flex-col gap-4 overflow-y-auto pr-2">

                        {/* Drug Normalization Card (Architecture Step 6) */}
                        {!isProcessing && (
                            <div className={`rounded-xl border shadow-sm p-5 ${highContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-violet-50 border-violet-100'}`}>
                                <div className="flex items-start gap-4">
                                    <div className="bg-violet-100 p-2 rounded-full mt-1">
                                        <ArrowRightLeft className="text-violet-600" size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold flex items-center gap-2 ${highContrast ? 'text-violet-300' : 'text-violet-900'}`}>
                                            <Pill size={16} /> Drug Name Normalization
                                        </h3>
                                        <div className="mt-2 space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-mono bg-violet-100 text-violet-700 px-2 py-0.5 rounded">Amoxil</span>
                                                <ArrowRightLeft size={14} className="text-violet-400" />
                                                <span className="font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Amoxicillin</span>
                                                <span className="text-xs text-slate-500 ml-auto">RxNorm Match</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-mono bg-violet-100 text-violet-700 px-2 py-0.5 rounded">Brufen</span>
                                                <ArrowRightLeft size={14} className="text-violet-400" />
                                                <span className="font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">Ibuprofen</span>
                                                <span className="text-xs text-slate-500 ml-auto">Synonym KB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Risk Alert */}
                        <div className={`rounded-xl border shadow-sm p-5 ${highContrast ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex items-start gap-4">
                                <div className="bg-red-100 p-2 rounded-full mt-1">
                                    <ShieldAlert className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold flex items-center gap-2 ${highContrast ? 'text-red-400' : 'text-red-900'}`}>
                                        High Risk Alert
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-bold tracking-wider">SCORE: 82</span>
                                    </h3>
                                    <p className={`mt-1 font-medium ${highContrast ? 'text-red-200' : 'text-red-800'}`}>
                                        Interaction: Amoxicillin + Ibuprofen
                                    </p>
                                    <p className={`mt-2 text-sm leading-relaxed ${highContrast ? 'text-red-300' : 'text-red-700'}`}>
                                        Rule GI-104 (interaction_kb): Concurrent use of NSAIDs with certain antibiotics may increase
                                        gastrointestinal irritation risk. Recommend reviewing patient history for ulcer risks.
                                    </p>
                                    <div className="mt-4 flex gap-3">
                                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
                                            Override & Approve
                                        </button>
                                        <button className="px-4 py-2 bg-white text-red-700 border border-red-200 hover:bg-red-50 text-sm font-semibold rounded-lg shadow-sm transition-colors">
                                            Flag for Doctor Review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extracted Entities */}
                        <div className={`rounded-xl border shadow-sm flex-1 flex flex-col ${panelClasses}`}>
                            <div className={`px-5 py-4 border-b flex justify-between items-center ${highContrast ? 'border-zinc-700' : 'border-slate-100'}`}>
                                <h3 className="font-bold flex items-center gap-2 text-lg">
                                    <Type size={20} className="text-primary-500" />
                                    Extracted Entities
                                </h3>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded font-medium flex items-center gap-1">
                                    <Edit3 size={12} /> Editable & Auditable
                                </span>
                            </div>

                            <div className="p-5 flex-1 grid gap-4 overflow-y-auto">
                                {extractedData.map(item => (
                                    <div key={item.id} className={`group flex flex-col sm:flex-row items-start sm:items-center rounded-lg border p-3 transition-colors ${highContrast ? 'bg-zinc-800 border-zinc-700 hover:border-primary-500/50' : 'bg-white border-slate-200 hover:border-primary-300'} shadow-sm`}>
                                        <div className="w-1/3 mb-2 sm:mb-0">
                                            <label className={`text-xs uppercase tracking-wider font-semibold ${highContrast ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {item.field}
                                            </label>
                                        </div>
                                        <div className="w-full sm:w-2/3 flex items-center gap-3">
                                            <div className="relative flex-1 group-focus-within:ring-2 ring-primary-500 ring-offset-1 rounded-md transition-shadow">
                                                <input
                                                    type="text"
                                                    value={item.value}
                                                    onChange={(e) => handleEditChange(item.id, e.target.value)}
                                                    className={`w-full bg-transparent border-0 p-2 font-medium focus:outline-none focus:ring-0 ${highContrast ? 'text-primary-100' : 'text-slate-900'} hover:bg-slate-50 rounded transition-colors`}
                                                />
                                                <Edit3 size={14} className="absolute right-3 top-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold whitespace-nowrap shadow-sm ${getConfidenceColor(item.confidence)}`}>
                                                {item.confidence >= 90 ? <CheckCircle2 size={12} /> : item.confidence >= 70 ? <AlertTriangle size={12} /> : null}
                                                {item.confidence}%
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className={`mt-2 rounded-lg border border-dashed p-6 text-center ${highContrast ? 'border-zinc-700 bg-zinc-800/50' : 'border-slate-300 bg-slate-50'}`}>
                                    <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                                        + Add Missing Field
                                    </button>
                                </div>
                            </div>

                            <div className={`p-4 border-t flex justify-end gap-3 ${highContrast ? 'border-zinc-700 bg-zinc-900' : 'border-slate-100 bg-slate-50 rounded-b-xl'}`}>
                                <button className={`px-4 py-2 rounded-lg font-semibold text-sm border transition-colors ${highContrast ? 'border-zinc-700 text-slate-300 hover:bg-zinc-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                                    Reject & Re-queue
                                </button>
                                <button className="px-5 py-2 rounded-lg font-semibold text-sm bg-primary-600 hover:bg-primary-700 text-white shadow-sm flex items-center gap-2 transition-all active:scale-95">
                                    <CheckCircle2 size={18} />
                                    Submit to EMR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Demo Banner */}
            <div className="fixed bottom-0 left-0 right-0 bg-amber-400 text-amber-950 px-4 py-2 border-t border-amber-500 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-bold">
                    <AlertTriangle size={18} />
                    ⚠️ For demo/educational use only. Do not process Real Patient Data (PHI).
                </div>
            </div>
        </div>
    );
}
