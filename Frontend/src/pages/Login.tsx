import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import edhecLogo from '../assets/logoData';

// Neumorphic design tokens
const NEU_BG = '#e0e5ec';
const neuRaised = '8px 8px 15px #a3b1c6, -8px -8px 15px #ffffff';
const neuInset = 'inset 6px 6px 12px #b8bec7, inset -6px -6px 12px #ffffff';
const neuBtnActive = 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [btnPressed, setBtnPressed] = useState(false);

  const roleBadges = [
    { label: 'CTO', bg: '#6d28d9' },
    { label: 'Admin', bg: '#1b4fce' },
    { label: 'Doctor', bg: '#0d9488' },
    { label: 'Pharmacist', bg: '#059669' },
    { label: 'Lab Tech', bg: '#d97706' },
    { label: 'Receptionist', bg: '#e11d48' },
    { label: 'Accountant', bg: '#0e7490' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) setError(result.error ?? 'Invalid credentials');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-stretch"
      style={{ background: NEU_BG }}
    >
      {/* Left branding panel — desktop only */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: '#0a1628' }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <img
              src={edhecLogo}
              alt="Edu Herbal Clinic"
              className="w-12 h-12 rounded-full object-contain ring-2 ring-white/20 bg-white p-0.5"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div>
              <p className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>EduHMS</p>
              <p className="text-[#0d9488] text-[10px] tracking-widest uppercase font-medium">Edu Herbal Clinic</p>
            </div>
          </div>

          <h2
            className="text-white text-3xl font-bold leading-snug mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Your good health<br />
            <span style={{ color: '#0d9488' }}>is our concern.</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            A fully integrated hospital platform for patient care, pharmacy, laboratory, billing, ward management, telemedicine, and AI-driven insights — across all branches.
          </p>

          {/* Feature highlights */}
          {[
            { icon: '🧑‍⚕️', text: '14+ clinical and admin modules' },
            { icon: '🤖', text: 'AI assistant for CTO & Admin' },
            { icon: '💊', text: 'Drug interaction safety (CDSS)' },
            { icon: '📡', text: 'Telemedicine & remote consults' },
            { icon: '🔐', text: 'Role-based access control' },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 py-1.5">
              <span className="text-sm w-5 shrink-0">{f.icon}</span>
              <p className="text-white/50 text-xs">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Branches */}
        <div>
          <p className="text-white/20 text-[10px] uppercase tracking-widest mb-2">Active Branches</p>
          {[
            { name: 'Accra — Main Hospital', dot: '#22c55e' },
            { name: 'Mankessim — Herbal Centre', dot: '#0d9488' },
          ].map((b) => (
            <div key={b.name} className="flex items-center gap-2.5 py-2 border-b border-white/5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.dot }} />
              <span className="text-white/40 text-xs">{b.name}</span>
            </div>
          ))}
          <p className="text-white/15 text-[10px] mt-4 text-center">
            © {new Date().getFullYear()} EduHMS · All rights reserved
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-10"
        style={{ background: NEU_BG }}
      >
        {/* Mobile branding */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <img
            src={edhecLogo}
            alt="EduHMS"
            className="w-10 h-10 rounded-full object-contain bg-white p-0.5"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <div>
            <p className="font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>EduHMS</p>
            <p className="text-[10px] text-[#0d9488] font-medium">Edu Herbal Clinic</p>
          </div>
        </div>

        {/* Neumorphic card */}
        <div
          className="w-full max-w-md rounded-3xl p-8"
          style={{ background: NEU_BG, boxShadow: neuRaised }}
        >
          <h1
            className="text-3xl font-bold text-center text-[#1a202c] mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Sign In
          </h1>
          <p className="text-sm text-center text-slate-400 mb-6">Enter your staff credentials</p>

          {/* Quick Access Role Labels */}
          <div className="mb-6">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mb-2.5 text-center">Quick Access Roles</p>
            <div className="flex flex-wrap justify-center gap-2">
              {roleBadges.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => {
                    setActiveRole(activeRole === r.label ? null : r.label);
                    setError('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: r.bg,
                    boxShadow: activeRole === r.label
                      ? `inset 2px 2px 5px rgba(0,0,0,0.3), inset -1px -1px 3px rgba(255,255,255,0.1)`
                      : '3px 3px 6px #a3b1c6, -2px -2px 5px #ffffff',
                    opacity: activeRole && activeRole !== r.label ? 0.6 : 1,
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Email / Staff ID
              </label>
              <div
                className="flex items-center rounded-2xl px-4 py-3 gap-3"
                style={{ background: NEU_BG, boxShadow: neuInset }}
              >
                <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@eduhms.gh"
                  required
                  className="flex-1 bg-transparent text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
                <button type="button" className="text-xs text-[#1b4fce] hover:underline font-medium">
                  Forgot?
                </button>
              </div>
              <div
                className="flex items-center rounded-2xl px-4 py-3 gap-3"
                style={{ background: NEU_BG, boxShadow: neuInset }}
              >
                <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11" r="1" fill="currentColor" />
                </svg>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="flex-1 bg-transparent text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ background: '#fef2f2', boxShadow: neuInset }}
              >
                <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Submit button — neumorphic raised, sinks on press */}
            <button
              type="submit"
              disabled={loading}
              onMouseDown={() => setBtnPressed(true)}
              onMouseUp={() => setBtnPressed(false)}
              onMouseLeave={() => setBtnPressed(false)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-100 disabled:opacity-50"
              style={{
                background: NEU_BG,
                color: '#1b4fce',
                boxShadow: btnPressed || loading ? neuBtnActive : neuRaised,
                letterSpacing: '0.05em',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#1b4fce" strokeWidth="3" strokeOpacity="0.2" />
                    <path d="M12 2a10 10 0 0110 10" stroke="#1b4fce" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-6">
            For new accounts or password resets, contact the CTO.
          </p>
        </div>

        {/* Below-card tagline */}
        <p className="text-[11px] text-slate-400 text-center mt-6">
          EduHMS v2.4.1 · Your Good Health Is Our Concern
        </p>
      </div>
    </div>
  );
}

function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="7" ry="5" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function EyeOffIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M7 4.2A7 5 0 0114 8a6.8 6.8 0 01-1 1.5M4.5 4.5A7 5 0 002 8a7 5 0 007 5 6.8 6.8 0 003.5-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
