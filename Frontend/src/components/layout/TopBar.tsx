import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Branch } from '../../types';

interface TopBarProps {
  title: string;
  onSearch?: (q: string) => void;
  onNavigate: (page: string) => void;
  onMenuToggle?: () => void;
}

export default function TopBar({ title, onSearch, onNavigate, onMenuToggle }: TopBarProps) {
  const { user, activeBranch, setActiveBranch, logout, isCTO, isAdmin } = useAuth();
  const [searchVal, setSearchVal] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const canSwitchBranch = isCTO() || isAdmin();
  const branches: Branch[] = ['Accra', 'Mankessim', 'All'];

  return (
    <header className="h-14 bg-white border-b border-[#dbe4ef] flex items-center px-4 gap-3 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-slate-600" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Title */}
      <h1 className="font-semibold text-[#0f172a] text-base shrink-0 capitalize truncate max-w-[120px] sm:max-w-none" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h1>

      {/* Search */}
      <div className="hidden sm:block flex-1 max-w-md relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search patients by name, MRN, or phone..."
          value={searchVal}
          onChange={(e) => { setSearchVal(e.target.value); onSearch?.(e.target.value); }}
          onFocus={() => { if (searchVal) onNavigate('patients'); }}
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#f0f4f8] border border-transparent rounded-lg focus:outline-none focus:border-[#1b4fce] focus:bg-white transition-colors placeholder:text-slate-400"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Branch switcher */}
      {canSwitchBranch ? (
        <div className="flex items-center gap-1 bg-[#f0f4f8] rounded-lg p-0.5">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBranch(b)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeBranch === b
                  ? 'bg-white text-[#1b4fce] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {b === 'All' ? 'All Branches' : b}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f0f4f8] rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-slate-600">{activeBranch}</span>
        </div>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 16 16" fill="none">
            <path d="M8 1a5 5 0 015 5v3l1 2H2l1-2V6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        {showNotif && (
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-[#dbe4ef] z-30 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notifications</p>
            {[
              { icon: '🔴', text: 'Low stock: Lisinopril 10mg (60 tabs left)', time: '5m ago' },
              { icon: '🟡', text: 'Lab result pending approval: LAB-001', time: '12m ago' },
              { icon: '🔵', text: '2 prescriptions awaiting dispense', time: '18m ago' },
              { icon: '🟣', text: 'Follow-up due: Adjoa Mensah (Today)', time: '1h ago' },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-[#f0f4f8] last:border-0">
                <span className="text-sm shrink-0 mt-0.5">{n.icon}</span>
                <div>
                  <p className="text-xs text-slate-700">{n.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative">
        <button
          onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name?.split(' ')[0]}</span>
          <svg className="w-3 h-3 text-slate-400" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {showProfile && (
          <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-[#dbe4ef] z-30 p-2">
            <div className="px-3 py-2 border-b border-[#f0f4f8] mb-1">
              <p className="text-sm font-semibold text-[#0f172a]">{user?.name}</p>
              <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            </div>
            <button
              onClick={() => { setShowProfile(false); onNavigate('profile'); }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              My Profile
            </button>
            <button
              onClick={() => { setShowProfile(false); logout(); }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
