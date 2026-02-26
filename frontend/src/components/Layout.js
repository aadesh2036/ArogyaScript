import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { FiUpload, FiGrid, FiLogOut } from 'react-icons/fi';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { href: '/upload', label: 'Upload', icon: FiUpload },
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
          <h1 className="text-xl font-bold tracking-tight">ArogyaScript</h1>
          <p className="text-primary-100 text-xs mt-1">Prescription Intelligence</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                router.pathname === href ? 'bg-primary-600' : 'hover:bg-primary-600/50'
              }`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-600">
          <p className="text-xs text-primary-200 mb-2">{user.name}</p>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 text-sm text-primary-200 hover:text-white transition"
          >
            <FiLogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {title && <h2 className="text-2xl font-semibold mb-6">{title}</h2>}
        {children}
      </main>
    </div>
  );
}
