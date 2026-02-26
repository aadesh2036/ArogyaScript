import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import {
    ShieldCheck, Activity, Users, AlertCircle, FileText, Download,
    Filter, CheckCircle2, History, Clock, Tag
} from 'lucide-react';

const metricsData = [
    { name: 'Mon', processed: 120, edits: 15 },
    { name: 'Tue', processed: 180, edits: 20 },
    { name: 'Wed', processed: 150, edits: 12 },
    { name: 'Thu', processed: 210, edits: 25 },
    { name: 'Fri', processed: 190, edits: 18 },
    { name: 'Sat', processed: 80, edits: 5 },
    { name: 'Sun', processed: 60, edits: 8 },
];

const confidenceData = [
    { time: '08:00', conf: 92 },
    { time: '10:00', conf: 95 },
    { time: '12:00', conf: 88 },
    { time: '14:00', conf: 96 },
    { time: '16:00', conf: 94 },
    { time: '18:00', conf: 89 }
];

const historyTable = [
    { id: 'RX-9921', date: '2023-10-24 14:30', persona: 'Pharmacist', confidence: 96, edits: 'No', status: 'Approved' },
    { id: 'RX-9920', date: '2023-10-24 14:15', persona: 'Admin', confidence: 72, edits: 'Yes (1 field)', status: 'Approved' },
    { id: 'RX-9919', date: '2023-10-24 13:55', persona: 'Doctor', confidence: 85, edits: 'No', status: 'Flagged (Risk)' },
    { id: 'RX-9918', date: '2023-10-24 13:10', persona: 'Pharmacist', confidence: 98, edits: 'No', status: 'Approved' },
    { id: 'RX-9917', date: '2023-10-24 11:45', persona: 'Pharmacist', confidence: 64, edits: 'Yes (3 fields)', status: 'Approved' },
];

const eventLog = [
    { time: '14:30:12', type: 'pipeline.complete', detail: 'RX-9921 processed in 2340ms', level: 'info' },
    { time: '14:30:10', type: 'risk.flagged', detail: 'Interaction detected: Amoxicillin + Ibuprofen (GI-104)', level: 'warning' },
    { time: '14:15:45', type: 'entity.edited', detail: 'Pharmacist corrected dosage field on RX-9920', level: 'info' },
    { time: '13:55:30', type: 'risk.high', detail: 'RX-9919 flagged by doctor — risk score 82', level: 'error' },
    { time: '13:10:05', type: 'pipeline.complete', detail: 'RX-9918 processed in 1890ms', level: 'info' },
];

export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState('Last 7 Days');

    const getStatusColor = (status) => {
        if (status === 'Approved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (status.includes('Flagged')) return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const getConfidenceColor = (score) => {
        if (score >= 90) return 'text-emerald-600 font-bold';
        if (score >= 70) return 'text-amber-600 font-bold';
        return 'text-red-500 font-bold';
    };

    const getEventLevelColor = (level) => {
        if (level === 'error') return 'text-red-500 bg-red-50 border-red-100';
        if (level === 'warning') return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Head>
                <title>Admin Analytics | ArogyaScript</title>
            </Head>

            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-slate-800 text-white p-2 rounded-lg">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Admin Audit Console</h1>
                        <p className="text-xs text-slate-500 font-medium">Pipeline Step 10 — Analytics & Event Logging</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/processing" className="text-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium transition-colors shadow-sm">
                        Back to Dashboard
                    </Link>
                    <div className="h-6 w-px bg-slate-300" />
                    <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
                        <Download size={18} />
                        <span className="text-sm font-semibold">Export Audit Log (.csv)</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Processed</p>
                            <h2 className="text-4xl font-black text-slate-800">9,240</h2>
                            <p className="text-sm text-emerald-600 font-medium mt-2">+14% <span className="text-slate-400">vs last week</span></p>
                        </div>
                        <div className="bg-primary-100 p-3 rounded-xl text-primary-600">
                            <FileText size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Avg OCR Confidence</p>
                            <h2 className="text-4xl font-black text-slate-800">92.4%</h2>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92.4%' }} />
                            </div>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Manual Corrections</p>
                            <h2 className="text-4xl font-black text-slate-800">8.7%</h2>
                            <p className="text-sm text-red-500 font-medium mt-2">+1.2% <span className="text-slate-400">vs last week</span></p>
                        </div>
                        <div className="bg-violet-100 p-3 rounded-xl text-violet-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Processing Volume & Edits</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Bar dataKey="processed" name="Processed" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="edits" name="Manual Edits" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Confidence Trend (Today)</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={confidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                    <Area type="monotone" dataKey="conf" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#confGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Event Log (maps to `events` collection) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={20} className="text-slate-400" />
                            System Event Log
                            <span className="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-bold ml-2">events collection</span>
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {eventLog.map((e, i) => (
                            <div key={i} className="px-6 py-3 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                <span className="text-xs font-mono text-slate-400 pt-0.5 w-20 shrink-0">{e.time}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 ${getEventLevelColor(e.level)}`}>
                                    {e.type}
                                </span>
                                <span className="text-sm text-slate-600 flex-1">{e.detail}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prescriptions Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <History size={20} className="text-slate-400" />
                            Processed Prescriptions
                        </h3>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-50">
                            <Filter size={14} /> Filter
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-slate-500 bg-white uppercase tracking-wider font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Record ID & Date</th>
                                    <th className="px-6 py-4">Reviewer</th>
                                    <th className="px-6 py-4">AI Confidence</th>
                                    <th className="px-6 py-4">Manual Edits</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {historyTable.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{row.id}</div>
                                            <div className="text-xs text-slate-500">{row.date}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{row.persona}</td>
                                        <td className="px-6 py-4"><span className={getConfidenceColor(row.confidence)}>{row.confidence}%</span></td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${row.edits !== 'No' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {row.edits}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(row.status)}`}>
                                                {row.status === 'Approved' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 hover:text-primary-800 hover:underline font-semibold text-xs">View Audit Log</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm text-slate-500">
                        Showing 1-5 of 9,240 records
                        <div className="flex gap-1">
                            <button className="px-3 py-1 border border-slate-200 rounded text-slate-400" disabled>Previous</button>
                            <button className="px-3 py-1 border border-slate-200 rounded bg-white font-medium text-slate-700 shadow-sm">Next</button>
                        </div>
                    </div>
                </div>

                {/* Annotations Placeholder (maps to `annotations` collection) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <Tag size={32} className="mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Annotation Management</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Bounding-box dataset management for training data will be available here once the backend integration is complete.
                    </p>
                    <span className="inline-block mt-3 text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-700 font-bold">annotations collection</span>
                </div>
            </main>
        </div>
    );
}
