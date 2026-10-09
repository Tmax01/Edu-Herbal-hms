import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/ui/Badge';
import auditService, { AuditLogEntry } from '../../services/auditService';

interface FormattedAuditEntry {
  id: string;
  timestamp: string;
  userName: string;
  userId: string;
  action: string;
  module: string;
  target: string;
  branch: string;
  ip: string;
}

export default function AuditLogPage() {
  const { activeBranch } = useAuth();
  const [logs, setLogs] = useState<FormattedAuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditService.getAuditLogs({ limit: 100 });
      const formatted: FormattedAuditEntry[] = (res.items || []).map((e: AuditLogEntry) => {
        const dateObj = new Date(e.createdAt);
        const timestamp = isNaN(dateObj.getTime())
          ? e.createdAt
          : `${dateObj.toISOString().slice(0, 10)} ${dateObj.toTimeString().slice(0, 8)}`;

        const userName = e.actorUser?.fullName || (e.actorId ? `Staff (${e.actorId})` : 'System');
        const userId = e.actorUser?.id || e.actorId || 'SYSTEM';

        // Extract action & target from diffState or actionType
        const action =
          e.diffState?.action ||
          e.actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

        let target = '—';
        if (e.diffState?.targetEntity) {
          target = `${e.diffState.targetEntity}${e.diffState.targetId ? ` (${e.diffState.targetId})` : ''}`;
        } else if (e.diffState?.staffId) {
          target = `Staff: ${e.diffState.staffId}`;
        } else if (e.diffState?.action) {
          target = e.diffState.action;
        }

        const branch = e.diffState?.branch || 'All';
        const module = (e.moduleName || 'SYSTEM').toUpperCase();

        return {
          id: e.id,
          timestamp,
          userName,
          userId,
          action,
          module,
          target,
          branch,
          ip: e.ipAddress || '127.0.0.1',
        };
      });

      setLogs(formatted);
    } catch (err: any) {
      console.warn('Failed to load audit logs from API:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to retrieve audit trail');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const rawModules = Array.from(new Set(logs.map((e) => e.module))).filter(Boolean);
  const modules = ['All', ...rawModules];

  const filtered = logs.filter((e) => {
    const branchOk = activeBranch === 'All' || e.branch === activeBranch || e.branch === 'All';
    const modOk = moduleFilter === 'All' || e.module === moduleFilter;
    const searchOk =
      !search ||
      e.userName.toLowerCase().includes(search.toLowerCase()) ||
      e.userId.toLowerCase().includes(search.toLowerCase()) ||
      e.target.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.module.toLowerCase().includes(search.toLowerCase());
    return branchOk && modOk && searchOk;
  });

  const actionColor = (action: string): string => {
    const act = action.toLowerCase();
    if (act.includes('creat') || act.includes('submit') || act.includes('activate')) return 'text-green-600 bg-green-50';
    if (act.includes('reset') || act.includes('dispens') || act.includes('record') || act.includes('letter')) return 'text-blue-600 bg-blue-50';
    if (act.includes('view') || act.includes('fetch')) return 'text-slate-600 bg-slate-50';
    if (act.includes('deactiv') || act.includes('delete')) return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'User ID', 'Action', 'Module', 'Target', 'Branch', 'IP'];
    const rows = filtered.map((e) => [e.timestamp, e.userName, e.userId, e.action, e.module, e.target, e.branch, e.ip]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Audit Log</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Fetching logs…' : `${filtered.length} entries · Full system activity trail`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-slate-600 border border-[#dbe4ef] rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh logs"
          >
            ↻ Refresh
          </button>
          <button
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-600 border border-[#dbe4ef] rounded-lg hover:bg-slate-50 transition-colors"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-5"><DepartmentGuide department="audit_log" /></div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-center gap-2">
        <span className="text-amber-600">🔒</span>
        <p className="text-xs text-amber-700 font-medium">Audit logs are tamper-evident and read-only. Security events and critical hospital actions are recorded here automatically.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
          ✕ {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search user, user ID, action, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
          />
        </div>
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
        >
          {modules.map((m) => (
            <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f8]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Module</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Target</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f8]">
            {filtered.map((entry) => (
              <tr key={entry.id} className="hover:bg-[#f8fafc] transition-colors">
                <td className="px-5 py-3">
                  <span className="font-mono text-xs text-slate-600">{entry.timestamp}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      {entry.userName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#0f172a]">{entry.userName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{entry.userId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${actionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="muted">{entry.module}</Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-600">{entry.target}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[10px] text-slate-400">{entry.ip}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                  {loading ? 'Loading audit records…' : 'No audit entries found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-12 text-sm">
            {loading ? 'Loading audit records…' : 'No audit entries found'}
          </p>
        )}
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl border border-[#dbe4ef] p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[10px] text-slate-500">{entry.timestamp}</span>
              <Badge variant="muted">{entry.module}</Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {entry.userName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#0f172a]">{entry.userName}</p>
                <p className="text-[10px] text-slate-400 font-mono">{entry.userId}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${actionColor(entry.action)}`}>
                {entry.action}
              </span>
              <span className="text-xs text-slate-600 break-all">{entry.target}</span>
            </div>
            <p className="font-mono text-[10px] text-slate-300 mt-2">IP: {entry.ip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
