import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiMail, FiLock, FiActivity } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center ocean-gradient-light relative overflow-hidden">
      <div className="ocean-bubbles" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-btn mb-4">
            <FiActivity className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-primary-800">ArogyaScript</h1>
          <p className="text-primary-600/70 text-sm mt-1">Prescription Intelligence System</p>
        </div>

        {/* Glass Card */}
        <div className="glass rounded-2xl p-8 shadow-glass-lg">
          <h2 className="text-xl font-semibold text-primary-800 mb-1">Welcome back</h2>
          <p className="text-sm text-primary-600/60 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50" size={18} />
              <input
                type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input outline-none text-sm"
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50" size={18} />
              <input
                type="password" placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input outline-none text-sm"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full glass-btn text-white py-3 rounded-xl font-medium disabled:opacity-50 transition text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-primary-700/60">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 font-medium hover:text-primary-700 transition">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
