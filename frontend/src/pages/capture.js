import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Sun, Activity, ArrowLeft, Gauge, Eye, Crop } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CaptureScreen() {
    const router = useRouter();
    const [qualityScore, setQualityScore] = useState(45);
    const [captured, setCaptured] = useState(false);
    const [autoTip, setAutoTip] = useState('Position document inside the frame');

    // Quality sub-scores for the assessment panel
    const [qualityMetrics, setQualityMetrics] = useState({
        blur: 62,
        lighting: 55,
        alignment: 70,
        resolution: 80,
    });

    useEffect(() => {
        if (captured) return;
        const interval = setInterval(() => {
            const blur = Math.floor(Math.random() * 30) + 55;
            const lighting = Math.floor(Math.random() * 35) + 50;
            const alignment = Math.floor(Math.random() * 25) + 60;
            const resolution = 80;
            const avg = Math.round((blur + lighting + alignment + resolution) / 4);

            setQualityMetrics({ blur, lighting, alignment, resolution });
            setQualityScore(avg);

            if (avg > 80) setAutoTip('Hold steady...');
            else if (avg < 60) setAutoTip('Move closer to document. Increase light.');
            else setAutoTip('Searching for document edges...');
        }, 2000);
        return () => clearInterval(interval);
    }, [captured]);

    const handleCapture = () => {
        setCaptured(true);
        setQualityScore(92);
        setQualityMetrics({ blur: 95, lighting: 88, alignment: 93, resolution: 92 });
        setAutoTip('Document captured successfully.');
    };

    const handleRetake = () => {
        setCaptured(false);
        setQualityScore(45);
        setAutoTip('Position document inside the frame');
    };

    const MetricBar = ({ label, value, icon: Icon }) => (
        <div className="flex items-center gap-3">
            <Icon size={14} className="text-zinc-500 shrink-0" />
            <span className="text-xs font-medium text-zinc-400 w-20">{label}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                    style={{ width: `${value}%` }}
                />
            </div>
            <span className={`text-xs font-bold w-8 text-right ${value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans">
            <Head>
                <title>Capture Document | ArogyaScript</title>
            </Head>

            {/* Top Bar */}
            <header className="px-4 py-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
                <Link href="/" className="p-2 bg-zinc-800/50 rounded-full hover:bg-zinc-700 transition">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-lg font-bold tracking-tight">Scan Prescription</h1>
                <div className="p-2 text-transparent"><Activity size={24} /></div>
            </header>

            {/* Viewfinder */}
            <main className="flex-1 relative flex flex-col justify-center items-center overflow-hidden">
                <div className="absolute inset-0 z-0 bg-zinc-900 flex items-center justify-center">
                    {captured ? (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center opacity-80 backdrop-blur-sm">
                            <div className="bg-white/10 w-3/4 h-2/3 rounded-lg border border-white/20 shadow-2xl skew-y-2 transform transition-all duration-500" />
                        </div>
                    ) : (
                        <div className="w-full h-full animate-pulse bg-zinc-800/50" />
                    )}
                </div>

                {/* Framing Guide */}
                {!captured && (
                    <div className="relative z-10 w-10/12 aspect-[3/4] max-w-sm rounded-[2rem] border-2 border-dashed border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] flex items-center justify-center">
                        <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-3xl transition-colors ${qualityScore > 80 ? 'border-emerald-400' : 'border-white'}`} />
                        <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-3xl transition-colors ${qualityScore > 80 ? 'border-emerald-400' : 'border-white'}`} />
                        <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-3xl transition-colors ${qualityScore > 80 ? 'border-emerald-400' : 'border-white'}`} />
                        <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-3xl transition-colors ${qualityScore > 80 ? 'border-emerald-400' : 'border-white'}`} />
                        <Camera size={48} strokeWidth={1} className="text-white/50 animate-pulse" />
                    </div>
                )}

                {/* Auto-tips */}
                <div className="absolute top-16 left-0 right-0 flex justify-center z-20">
                    <div className={`px-4 py-2 rounded-full backdrop-blur-md shadow-lg font-medium text-sm flex items-center gap-2 transition-all ${qualityScore > 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            qualityScore < 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-zinc-800/60 text-white/90'
                        }`}>
                        {qualityScore < 60 && !captured && <Sun size={16} />}
                        {autoTip}
                    </div>
                </div>
            </main>

            {/* Bottom Panel */}
            <footer className="z-10 bg-zinc-950 pb-8 pt-6 px-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-zinc-800">

                {/* Image Quality Assessment (Architecture Step 3) */}
                <div className="mb-6 bg-zinc-900/70 rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Gauge size={14} /> Image Quality Assessment
                        </span>
                        <span className={`text-sm font-black ${qualityScore >= 80 ? 'text-emerald-400' : qualityScore >= 60 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                            {qualityScore}%
                        </span>
                    </div>
                    <div className="space-y-2.5">
                        <MetricBar label="Sharpness" value={qualityMetrics.blur} icon={Eye} />
                        <MetricBar label="Lighting" value={qualityMetrics.lighting} icon={Sun} />
                        <MetricBar label="Alignment" value={qualityMetrics.alignment} icon={Crop} />
                        <MetricBar label="Resolution" value={qualityMetrics.resolution} icon={Gauge} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4">
                    {!captured ? (
                        <button
                            onClick={handleCapture}
                            className="w-full h-16 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform"
                        >
                            Capture Document
                        </button>
                    ) : (
                        <>
                            {qualityScore < 80 ? (
                                <button
                                    onClick={handleRetake}
                                    className="w-full py-4 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/50 font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <AlertCircle size={20} />
                                    Suggest Retake
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push('/processing')}
                                    className="w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <CheckCircle2 size={24} />
                                    Process Document
                                </button>
                            )}
                            <button
                                onClick={handleRetake}
                                className="w-full py-3 rounded-xl bg-transparent text-zinc-400 font-semibold text-center hover:text-white transition-colors"
                            >
                                Retake Photo
                            </button>
                        </>
                    )}
                </div>
            </footer>
        </div>
    );
}
