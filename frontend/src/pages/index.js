import Head from 'next/head';
import Link from 'next/link';
import PipelineStepper from '../components/PipelineStepper';
import {
  Camera, UploadCloud, Activity, ShieldCheck, ArrowRight, Layers, Cpu,
  FileSearch, Pill, AlertTriangle, BarChart3, BookOpen
} from 'lucide-react';

const FEATURES = [
  {
    href: '/capture',
    icon: Camera,
    title: 'Capture & Upload',
    desc: 'Mobile-first capture with real-time framing guides, quality scoring, and image preprocessing.',
    step: 'Steps 2–3',
  },
  {
    href: '/processing',
    icon: Cpu,
    title: 'AI Processing Dashboard',
    desc: 'Pharmacist view with real-time OCR, entity extraction, drug normalization, interaction reasoning & risk scoring.',
    step: 'Steps 4–8',
  },
  {
    href: '/upload',
    icon: UploadCloud,
    title: 'Upload Prescription',
    desc: 'Drag & drop prescription images for instant AI analysis with structured reporting.',
    step: 'Step 9',
  },
  {
    href: '/analytics',
    icon: BarChart3,
    title: 'Admin Analytics',
    desc: 'Audit console with processing metrics, confidence trends, event logs, and annotation management.',
    step: 'Step 10',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Head>
        <title>ArogyaScript — Prescription Intelligence</title>
        <meta name="description" content="AI-powered medical prescription intelligence system with OCR, entity extraction, drug interaction reasoning, and risk scoring." />
      </Head>

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 text-white p-2 rounded-xl shadow-lg shadow-primary-600/20">
              <Layers size={28} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">ArogyaScript</h1>
              <p className="text-xs text-slate-500 font-medium">Prescription Intelligence System</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="text-sm px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-semibold shadow-sm transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-emerald-800 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%226%22%20cy%3D%226%22%20r%3D%221.5%22%20fill%3D%22white%22%20opacity%3D%220.08%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />
          <div className="max-w-6xl mx-auto px-6 relative z-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-sm font-semibold mb-6 backdrop-blur-sm border border-white/10">
                <Pill size={14} /> AI-Powered Medical Intelligence
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6">
                From Prescription Image to Actionable Intelligence
              </h2>
              <p className="text-lg text-primary-100 leading-relaxed mb-8">
                An end-to-end AI system that converts prescription images into structured medical data —
                including entity extraction, drug interaction reasoning, risk scoring, and explainable reporting.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/capture" className="px-6 py-3 bg-white text-primary-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-primary-50 transition-all active:scale-95 flex items-center gap-2">
                  <Camera size={20} /> Start Scanning
                </Link>
                <Link href="/processing" className="px-6 py-3 bg-primary-500/30 text-white font-bold rounded-xl backdrop-blur-sm border border-white/20 hover:bg-primary-500/50 transition-all active:scale-95 flex items-center gap-2">
                  <Activity size={20} /> View Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Visualization */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">End-to-End AI Pipeline</h3>
            <p className="text-slate-500 max-w-xl mx-auto">
              Perception → Understanding → Reasoning → Reporting
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex justify-center">
            <PipelineStepper
              activeStep=""
              completedSteps={['auth', 'upload', 'preprocess', 'ocr', 'entities', 'normalize', 'interactions', 'risk', 'report', 'analytics']}
              direction="horizontal"
            />
          </div>
        </section>

        {/* Feature Cards */}
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Link key={f.href} href={f.href} className="group bg-white p-7 rounded-2xl shadow-sm border border-slate-200 hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/5 transition-all flex gap-5">
                  <div className="bg-primary-50 p-3, rounded-xl text-primary-600 group-hover:bg-primary-100 transition-colors h-fit mt-1">
                    <Icon size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-lg font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{f.title}</h4>
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">{f.step}</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                    <div className="mt-3 text-primary-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <span className="font-medium">ArogyaScript © 2024</span>
          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold text-xs border border-amber-200">
            ⚠️ Demo / Educational Use Only
          </span>
        </div>
      </footer>
    </div>
  );
}
