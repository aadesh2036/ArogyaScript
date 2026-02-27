import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FiUpload, FiGrid, FiLogOut, FiActivity, FiList,
  FiAlertTriangle, FiDatabase, FiSettings, FiUser, FiBarChart2, FiMenu, FiX
} from 'react-icons/fi';
import { useState } from 'react';

const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
      { href: '/upload', label: 'Upload', icon: FiUpload },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { href: '/dashboard?tab=history', label: 'History', icon: FiList },
      { href: '/dashboard?tab=anomalies', label: 'Anomalies', icon: FiAlertTriangle },
      { href: '/dashboard?tab=analytics', label: 'Analytics', icon: FiBarChart2 },
    ],
  },
  {
    title: 'Reference',
    items: [
      { href: '/dashboard?tab=drugs', label: 'Drug Database', icon: FiDatabase },
      { href: '/dashboard?tab=settings', label: 'Settings', icon: FiSettings },
    ],
  },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }

  const isActive = (href) => {
    if (href.includes('?')) return router.asPath === href;
    return router.pathname === href;
  };

  const sidebar = (
    <>
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
          <FiActivity className="text-white" size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">ArogyaScript</h1>
          <p className="text-primary-300/70 text-[10px] tracking-wide uppercase">Prescription Intelligence</p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto custom-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary-400/50">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href} href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    isActive(href)
                      ? 'bg-accent-500/20 text-white shadow-glass backdrop-blur-sm font-medium border border-accent-500/10'
                      : 'text-primary-200/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={17} /> {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 mx-3 mb-3 rounded-xl bg-white/8 backdrop-blur-sm border border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center">
            <FiUser size={14} className="text-accent-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user.name}</p>
            <p className="text-[10px] text-primary-300/60 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="flex items-center gap-2 text-xs text-primary-300/60 hover:text-white transition-colors duration-200 w-full"
        >
          <FiLogOut size={14} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex ocean-gradient-light">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 ocean-gradient">
        {sidebar}
      </aside>

      {/* Sidebar — mobile */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col ocean-gradient transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-white/70 hover:text-white"
        >
          <FiX size={20} />
        </button>
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button className="lg:hidden text-navy p-1" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={22} />
          </button>
          {title && <h2 className="text-lg sm:text-xl font-semibold text-navy truncate">{title}</h2>}
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
