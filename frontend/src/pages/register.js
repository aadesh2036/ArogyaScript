import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { FiUser, FiMail, FiLock, FiActivity } from 'react-icons/fi';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <h1 className="text-3xl font-bold text-navy">ArogyaScript</h1>
          <p className="text-primary-600/70 text-sm mt-1">Create your account</p>
        </div>

        {/* Glass Card */}
        <div className="glass rounded-2xl p-8 shadow-glass-lg">
          <h2 className="text-xl font-semibold text-navy mb-1">Get started</h2>
          <p className="text-sm text-primary-600/60 mb-6">Join the prescription intelligence platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50" size={18} />
              <input
                name="name" placeholder="Full Name" value={form.name}
                onChange={handleChange} required
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input outline-none text-sm"
              />
            </div>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50" size={18} />
              <input
                name="email" type="email" placeholder="Email address" value={form.email}
                onChange={handleChange} required
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input outline-none text-sm"
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500/50" size={18} />
              <input
                name="password" type="password" placeholder="Password (min 6 chars)" value={form.password}
                onChange={handleChange} required minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-xl glass-input outline-none text-sm"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full glass-btn text-white py-3 rounded-xl font-medium disabled:opacity-50 transition text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-primary-700/60">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
