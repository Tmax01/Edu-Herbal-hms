import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCallCentre } from '../../hooks/useCallCentre';
import { CallOutcome } from '../../types/callcentre';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';

export default function CallCentrePage() {
  const { activeBranch, user } = useAuth();
  const { callLogs: logs, loading, logCall } = useCallCentre(activeBranch);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ patientName: '', reason: '', notes: '', outcome: 'Resolved' as CallOutcome, followUpDate: '' });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const filtered = logs.filter((l) => activeBranch === 'All' || !l.branch || l.branch === activeBranch);
  const complaints = filtered.filter((l) => l.outcome === 'Complaint');
  const followUps = filtered.filter((l) => l.outcome === 'Follow-up Scheduled');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await logCall(
      {
        patientName: form.patientName,
        reason: form.reason,
        notes: form.notes,
        outcome: form.outcome,
      },
      user?.name
    );
    setSaved(true);
    setTimeout(() => { setShowNew(false); setSaved(false); setForm({ patientName: '', reason: '', notes: '', outcome: 'Resolved', followUpDate: '' }); }, 1200);
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Call Centre & CRM</h2>
          <p className="text-sm text-slate-400">{filtered.length} calls · {complaints.length} open complaints · {followUps.length} follow-ups</p>
        </div>
        <Button onClick={() => setShowNew(true)} icon={<PlusIcon />} size="sm">Log Call</Button>
      </div>

      <div className="mb-5"><DepartmentGuide department="callcentre" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main call log */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f0f4f8] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0f172a]">Call History</h3>
          </div>
          <div className="divide-y divide-[#f0f4f8]">
            {filtered.map((log) => (
              <div key={log.id} className="p-4 hover:bg-[#f8fafc] transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    log.outcome === 'Complaint' ? 'bg-red-500' :
                    log.outcome === 'Resolved' ? 'bg-green-500' :
                    log.outcome === 'Follow-up Scheduled' ? 'bg-blue-500' :
                    'bg-slate-400'
                  }`}>
                    📞
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#0f172a]">{log.patientName}</p>
                      <Badge variant={statusBadge(log.outcome)}>{log.outcome}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{log.reason} · {log.agentName}</p>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{log.notes}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-400">{log.callDate}</span>
                      {log.followUpDate && (
                        <span className="text-[10px] text-[#1b4fce] font-medium">Follow-up: {log.followUpDate}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No calls logged</p>}
          </div>
        </div>

        {/* Right panels */}
        <div className="space-y-4">
          {/* Open complaints */}
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <h3 className="text-sm font-semibold text-red-700 mb-3">⚠️ Open Complaints ({complaints.length})</h3>
            {complaints.map((c) => (
              <div key={c.id} className="p-2.5 bg-red-50 rounded-lg mb-2 last:mb-0">
                <p className="text-xs font-medium text-[#0f172a]">{c.patientName}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{c.notes.slice(0, 60)}…</p>
                <p className="text-[10px] text-slate-400 mt-1">{c.callDate}</p>
              </div>
            ))}
            {complaints.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No open complaints</p>}
          </div>

          {/* Follow-ups due */}
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-700 mb-3">📅 Follow-ups Due ({followUps.length})</h3>
            {followUps.map((f) => (
              <div key={f.id} className="p-2.5 bg-blue-50 rounded-lg mb-2 last:mb-0">
                <p className="text-xs font-medium text-[#0f172a]">{f.patientName}</p>
                <p className="text-[10px] text-[#1b4fce] font-medium mt-0.5">Due: {f.followUpDate}</p>
              </div>
            ))}
            {followUps.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No follow-ups pending</p>}
          </div>
        </div>
      </div>

      {/* New call modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Log New Call">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Call logged successfully!</div>}
          <Input label="Patient Name *" placeholder="Patient name or 'Anonymous'" required value={form.patientName} onChange={set('patientName')} />
          <Input label="Reason for Call *" placeholder="e.g. Appointment Inquiry, Medication Query" required value={form.reason} onChange={set('reason')} />
          <Textarea label="Notes *" placeholder="Details of the call..." rows={3} required value={form.notes} onChange={set('notes')} />
          <Select label="Outcome *" required value={form.outcome} onChange={set('outcome')}>
            <option>Resolved</option>
            <option>Follow-up Scheduled</option>
            <option>Escalated</option>
            <option>No Answer</option>
            <option>Complaint</option>
          </Select>
          {form.outcome === 'Follow-up Scheduled' && (
            <Input label="Follow-up Date" type="date" value={form.followUpDate} onChange={set('followUpDate')} />
          )}
          <div className="flex gap-2">
            <Button type="submit">Save Call</Button>
            <Button type="button" variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
