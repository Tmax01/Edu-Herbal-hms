import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState, useEffect } from 'react';
import { StaffUser, Module } from '../../types';
import { defaultModulesByRole, roleLabels } from '../../constants/system';
import { Button } from '../../components/ui/Button';
import { useUsers } from '../../hooks/useUsers';
import userService from '../../services/userService';

const moduleLabels: Record<Module, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  appointments: 'Appointments',
  consultation: 'Consultation / EMR',
  pharmacy: 'Pharmacy',
  lab: 'Laboratory',
  billing: 'Billing & Accounts',
  ward: 'Ward / Admissions',
  nursing: 'Nursing Notes',
  followups: 'Follow-ups & Reviews',
  callcentre: 'Call Centre',
  production: 'Production',
  inventory: 'Inventory & Stores',
  suppliers: 'Supplier Directory',
  accounting: 'Accounting & Finance',
  hr: 'Human Resources',
  meetings: 'Meetings & Scheduling',
  chat: 'Staff Chat',
  daily_reports: 'Daily Activity Reports',
  telemedicine: 'Telemedicine',
  analytics: 'Analytics & Intelligence',
  ai_assistant: 'AI Assistant',
  reports: 'Reports',
  user_management: 'User Management',
  access_control: 'Access Control',
  audit_log: 'Audit Log',
};

const allModules = Object.keys(moduleLabels) as Module[];

export default function AccessControl() {
  const { users, setUsers, loading } = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const current: StaffUser = users.find((u) => u.id === selectedUserId) || users[0] || {
    id: '',
    name: 'Select a staff member',
    email: '',
    role: 'doctor',
    branch: 'Accra',
    department: '',
    phone: '',
    active: true,
    allowedModules: ['dashboard'],
    createdAt: '',
  };

  const toggleModule = (mod: Module) => {
    if (!current.id || mod === 'dashboard') return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== current.id) return u;
        const has = u.allowedModules.includes(mod);
        return {
          ...u,
          allowedModules: has ? u.allowedModules.filter((m) => m !== mod) : [...u.allowedModules, mod],
        };
      })
    );
  };

  const resetToDefault = async () => {
    if (!current.id) return;
    setSaving(true);
    setError(null);
    try {
      await userService.resetPermissionsToDefault(current.id);
      const defaultMods = defaultModulesByRole[current.role] || ['dashboard'];
      setUsers((prev) =>
        prev.map((u) => (u.id === current.id ? { ...u, allowedModules: defaultMods } : u))
      );
      setSaveMessage(`Reset access rules to default for ${current.name}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset default access rules');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!current.id) return;
    setSaving(true);
    setError(null);
    try {
      await userService.setPermissions(current.id, current.allowedModules);
      setSaveMessage(`Access rules saved for ${current.name}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save access rules');
    } finally {
      setSaving(false);
    }
  };

  const groupModules = {
    Clinical: ['patients', 'appointments', 'consultation', 'lab', 'pharmacy', 'ward', 'nursing', 'followups', 'telemedicine'] as Module[],
    Administrative: ['billing', 'accounting', 'callcentre', 'reports', 'analytics', 'ai_assistant', 'meetings', 'hr', 'chat', 'daily_reports'] as Module[],
    Operations: ['production', 'inventory', 'suppliers'] as Module[],
    'CTO / Admin': ['user_management', 'access_control', 'audit_log'] as Module[],
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Access Control</h2>
          <p className="text-sm text-slate-400">Set module-level permissions per staff member</p>
        </div>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium flex items-center gap-2">
          <span>✓</span> {saveMessage || `Access rules saved for ${current.name}`}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium flex items-center gap-2">
          <span>✕</span> {error}
        </div>
      )}

      <div className="mb-5"><DepartmentGuide department="access_control" /></div>

      {/* Mobile: staff select dropdown */}
      <div className="lg:hidden mb-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select Staff Member</label>
        <select
          value={current.id}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-[#dbe4ef] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} — {roleLabels[u.role]} ({u.branch})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Staff list — desktop only */}
        <div className="hidden lg:block bg-white rounded-xl border border-[#dbe4ef] p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Select Staff Member</p>
          {loading && <p className="text-xs text-slate-400 py-3">Loading staff roster…</p>}
          <div className="space-y-1">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${current.id === u.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#0f172a] truncate">{u.name}</p>
                  <p className="text-[10px] text-slate-400">{roleLabels[u.role]}</p>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">{u.allowedModules.length} mods</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module toggles */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#dbe4ef] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="font-semibold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{current.name}</h3>
              <p className="text-xs text-slate-400">{roleLabels[current.role]} · {current.branch} · {current.allowedModules.length}/{allModules.length} modules enabled</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={resetToDefault} disabled={saving || !current.id}>
                {saving ? 'Processing…' : 'Reset to Default'}
              </Button>
              <Button size="sm" onClick={handleSave} variant="teal" disabled={saving || !current.id}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            {Object.entries(groupModules).map(([group, mods]) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{group}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {mods.map((mod) => {
                    const enabled = current.allowedModules.includes(mod);
                    const isLocked = mod === 'dashboard'; // always on
                    return (
                      <div
                        key={mod}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${enabled ? 'border-blue-200 bg-blue-50' : 'border-[#f0f4f8] bg-[#f8fafc]'} ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => !isLocked && toggleModule(mod)}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${enabled ? 'text-[#1b4fce]' : 'text-slate-400'}`}>
                            {enabled ? '✓' : '○'}
                          </span>
                          <span className={`text-sm font-medium ${enabled ? 'text-[#0f172a]' : 'text-slate-400'}`}>
                            {moduleLabels[mod]}
                          </span>
                        </div>
                        <div
                          className={`w-9 h-5 rounded-full transition-all relative ${enabled ? 'bg-[#1b4fce]' : 'bg-slate-200'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
