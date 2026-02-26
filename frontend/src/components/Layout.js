import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiGrid, FiLogOut } from 'react-icons/fi';
import { Camera, Activity, BarChart3, Cpu, AlertTriangle, Layers } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { href: '/upload', label: 'Upload', icon: FiUpload },
  { href: '/capture', label: 'Capture', icon: Camera },
  { href: '/processing', label: 'Processing', icon: Cpu },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-700 text-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={22} className="text-primary-200" />
            <h1 className="text-xl font-bold tracking-tight">ArogyaScript</h1>
          </div>
          <p className="text-primary-200 text-xs">Prescription Intelligence</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition font-medium ${router.pathname === href
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-primary-100 hover:bg-primary-600/50'
                }`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-600">
          <p className="text-xs text-primary-200 mb-2 font-medium">{user.name}</p>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 text-sm text-primary-200 hover:text-white transition"
          >
            <FiLogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
          {children}
        </main>

        {/* Sticky Demo Banner */}
        <div className="bg-amber-400 text-amber-950 px-4 py-2 border-t border-amber-500">
          <div className="flex items-center justify-center gap-2 text-xs font-bold">
            <AlertTriangle size={14} />
            ⚠️ For demo/educational use only. Do not process real patient data.
          </div>
        </div>
      </div>
    </div>
  );
}
