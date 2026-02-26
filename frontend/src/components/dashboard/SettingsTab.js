import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiMail, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const card = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

function Field({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-primary-500">
        <Icon size={13} />
        {label}
      </label>
      {children}
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      {type === 'success' ? <FiCheck size={14} /> : <FiAlertCircle size={14} />}
      {message}
    </div>
  );
}

export default function SettingsTab() {
  const { user } = useAuth();

  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState({ loading: false, msg: '', type: '' });

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      setPwStatus({ loading: false, msg: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwStatus({ loading: false, msg: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setPwStatus({ loading: true, msg: '', type: '' });
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setPwStatus({ loading: false, msg: 'Password updated successfully.', type: 'success' });
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      setPwStatus({ loading: false, msg: err?.response?.data?.message || 'Failed to update password.', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Info */}
      <motion.div custom={0} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-accent-500/20 text-accent-600 flex items-center justify-center font-bold text-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-navy text-sm">Account Profile</h3>
            <p className="text-xs text-primary-400">Your registered details</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field icon={FiUser} label="Full Name">
            <div className="glass-input rounded-xl px-3 py-2 text-sm text-primary-700">
              {user?.name || '—'}
            </div>
          </Field>
          <Field icon={FiMail} label="Email Address">
            <div className="glass-input rounded-xl px-3 py-2 text-sm text-primary-700">
              {user?.email || '—'}
            </div>
          </Field>
          <Field icon={FiUser} label="Role">
            <div className="glass-input rounded-xl px-3 py-2 text-sm text-primary-700 capitalize">
              {user?.role || 'user'}
            </div>
          </Field>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div custom={1} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <FiLock className="text-primary-500" size={16} />
          <h3 className="font-semibold text-navy text-sm">Change Password</h3>
        </div>

        <form onSubmit={handlePwChange} className="space-y-4">
          <Field icon={FiLock} label="Current Password">
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none text-primary-700"
              placeholder="••••••••"
            />
          </Field>
          <Field icon={FiLock} label="New Password">
            <input
              type="password"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none text-primary-700"
              placeholder="••••••••"
            />
          </Field>
          <Field icon={FiLock} label="Confirm New Password">
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              required
              className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none text-primary-700"
              placeholder="••••••••"
            />
          </Field>

          <Alert type={pwStatus.type} message={pwStatus.msg} />

          <button
            type="submit"
            disabled={pwStatus.loading}
            className="w-full py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwStatus.loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </motion.div>

      {/* App Info */}
      <motion.div custom={2} variants={card} initial="hidden" animate="visible" className="glass-card rounded-2xl p-5 sm:p-6">
        <h3 className="font-semibold text-navy text-sm mb-4">Application Info</h3>
        <div className="space-y-2 text-sm">
          {[
            { label: 'App Name',      value: 'ArogyaScript' },
            { label: 'Backend API',   value: 'http://localhost:5000' },
            { label: 'ML Pipeline',   value: 'http://localhost:8001' },
            { label: 'AI Engine',     value: 'Gemini 2.0 Flash Lite' },
            { label: 'Version',       value: '0.1.0-beta' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-white/20 last:border-0">
              <span className="text-primary-400">{label}</span>
              <span className="text-primary-700 font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
