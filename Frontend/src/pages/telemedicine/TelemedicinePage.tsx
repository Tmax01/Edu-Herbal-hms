import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState } from 'react';
import { TelemedicineSession } from '../../types/telemedicine';
import { useAuth } from '../../contexts/AuthContext';
import { useTelemedicine } from '../../hooks/useTelemedicine';
import { usePatients } from '../../hooks/usePatients';
import { useUsers } from '../../hooks/useUsers';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';

const statusVariant: Record<TelemedicineSession['status'], 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  Scheduled: 'info',
  'In Progress': 'warning',
  Completed: 'success',
  Cancelled: 'muted',
  'No-show': 'danger',
};

const typeIcon: Record<string, string> = {
  Video: '🎥', Audio: '🎙️', Chat: '💬',
};

export default function TelemedicinePage() {
  const { user, activeBranch } = useAuth();
  const { sessions, loading, scheduleSession, startSession: doStart, completeSession: doComplete } = useTelemedicine(activeBranch);
  const { patients } = usePatients('', activeBranch);
  const { users: staffUsers } = useUsers(activeBranch);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showSession, setShowSession] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [selected, setSelected] = useState<TelemedicineSession | null>(null);
  const [saved, setSaved] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [form, setForm] = useState({
    patientId: '', doctorId: '', scheduledAt: '', duration: '30', type: 'Video',
    chiefComplaint: '', branch: 'Accra' as 'Accra' | 'Mankessim',
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const filtered = sessions.filter((s) => {
    const branchOk = activeBranch === 'All' || !s.branch || s.branch === activeBranch;
    if (!branchOk) return false;
    if (user?.role === 'doctor') return s.doctorId === user.id;
    return true;
  });

  const upcoming = filtered.filter((s) => ['Scheduled', 'In Progress'].includes(s.status));
  const completed = filtered.filter((s) => ['Completed', 'Cancelled', 'No-show'].includes(s.status));
  const displayed = activeTab === 'upcoming' ? upcoming : completed;

  const doctors = staffUsers.filter((u) => u.role === 'doctor' && u.active);
  const availableDoctors = doctors.length > 0 ? doctors : staffUsers.filter((u) => u.active !== false);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === form.patientId);
    const doctor = availableDoctors.find((u) => u.id === form.doctorId);
    await scheduleSession(
      {
        patientId: form.patientId,
        doctorId: form.doctorId,
        scheduledTime: form.scheduledAt.replace('T', ' '),
        durationMinutes: Number(form.duration),
        notes: form.chiefComplaint,
      },
      patient?.name,
      doctor?.name
    );
    setSaved(true);
    setTimeout(() => { setShowSchedule(false); setSaved(false); setForm({ patientId: '', doctorId: '', scheduledAt: '', duration: '30', type: 'Video', chiefComplaint: '', branch: 'Accra' }); }, 1200);
  };


  const completeSession = async () => {
    if (!selected) return;
    await doComplete(selected.id, { clinicalNotes: callNotes });
    setShowCall(false);
    setCallNotes('');
    setSelected(null);
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Telemedicine</h2>
          <p className="text-sm text-slate-400">Video, audio and chat consultations with patients</p>
        </div>
        <Button onClick={() => setShowSchedule(true)} icon={<PlusIcon />} size="sm">Schedule Session</Button>
      </div>

      {/* Stats */}
      <div className="mb-5"><DepartmentGuide department="telemedicine" /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Scheduled', count: sessions.filter((s) => s.status === 'Scheduled').length, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Completed', count: sessions.filter((s) => s.status === 'Completed').length, color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'No-shows', count: sessions.filter((s) => s.status === 'No-show').length, color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'This Month', count: sessions.filter((s) => (s.scheduledAt || s.scheduledTime || '').startsWith('2026-08')).length, color: 'text-teal-600 bg-teal-50 border-teal-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#f0f4f8] rounded-xl p-1 mb-5 w-fit">
        {(['upcoming', 'completed'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}>
            {t} <span className="ml-1 text-xs text-slate-400">({(t === 'upcoming' ? upcoming : completed).length})</span>
          </button>
        ))}
      </div>

      {/* Sessions list */}
      <div className="space-y-3">
        {displayed.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-[#dbe4ef] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#e8eef7] flex items-center justify-center text-xl shrink-0">
                  {typeIcon[s.type || 'Video']}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-[#0f172a] text-sm">{s.patientName}</p>
                    <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                    <span className="text-xs text-slate-400 bg-[#f0f4f8] px-2 py-0.5 rounded">{s.type || 'Video'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    <span className="font-medium">{s.doctorName}</span> · {s.scheduledAt || s.scheduledTime} · {s.duration || s.durationMinutes} min
                  </p>
                  <p className="text-xs text-slate-400 truncate">Complaint: {s.chiefComplaint || s.notes}</p>

                  {s.meetingLink && s.status === 'Scheduled' && (
                    <p className="text-xs text-[#1b4fce] font-mono mt-1">{s.meetingLink}</p>
                  )}
                  {s.notes && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700">{s.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {s.status === 'Scheduled' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => { setSelected(s); setShowCall(true); }}
                    >
                      {s.type === 'Video' ? '🎥 Join Call' : s.type === 'Audio' ? '🎙️ Start Call' : '💬 Open Chat'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setSelected(s); setShowSession(true); }}>Details</Button>
                  </>
                )}
                {s.status !== 'Scheduled' && (
                  <Button size="sm" variant="ghost" onClick={() => { setSelected(s); setShowSession(true); }}>View</Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-sm">No {activeTab} telemedicine sessions</p>
          </div>
        )}
      </div>

      {/* In-call Simulation Modal */}
      <Modal open={showCall} onClose={() => setShowCall(false)} title="" width="max-w-2xl">
        {selected && (
          <div>
            {/* Simulated video screen */}
            <div className="relative bg-[#0a1628] rounded-t-xl" style={{ height: 320 }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-3xl font-bold mb-3">
                  {selected.patientName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <p className="text-lg font-semibold">{selected.patientName}</p>
                <p className="text-white/40 text-sm mt-1">Connecting…</p>
              </div>
              {/* My preview */}
              <div className="absolute bottom-4 right-4 w-28 h-20 bg-[#1e293b] rounded-xl border-2 border-white/20 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0d9488] to-[#059669] flex items-center justify-center text-white text-sm font-bold">
                  {user?.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
              </div>
              {/* Status */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-mono">{(selected.scheduledAt || selected.scheduledTime || '').split(' ')[1] || '10:00'} · {selected.duration || selected.durationMinutes || 30} min</span>
              </div>
            </div>
            <div className="bg-[#111827] rounded-b-xl p-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                {[
                  { icon: '🎙️', label: 'Mute', active: false },
                  { icon: '📷', label: 'Camera', active: false },
                  { icon: '💬', label: 'Chat', active: false },
                  { icon: '🖥️', label: 'Share', active: false },
                ].map((btn) => (
                  <button key={btn.label} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
                    <span className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg">{btn.icon}</span>
                    <span className="text-[10px]">{btn.label}</span>
                  </button>
                ))}
                <button onClick={() => setShowCall(false)} className="flex flex-col items-center gap-1 text-white/60 hover:text-red-400 transition-colors">
                  <span className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-lg">📵</span>
                  <span className="text-[10px]">End</span>
                </button>
              </div>
              <div className="bg-[#1e293b] rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1.5">Session Notes</p>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Record consultation notes during the call..."
                  rows={3}
                  className="w-full bg-transparent text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={completeSession} className="flex-1">Complete Session &amp; Save Notes</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal open={showSession} onClose={() => { setShowSession(false); setSelected(null); }} title="Session Details" width="max-w-lg">
        {selected && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariant[selected.status]}>{selected.status}</Badge>
              <span className="text-xs bg-[#f0f4f8] text-slate-500 px-2 py-1 rounded font-medium">{typeIcon[selected.type || 'Video']} {selected.type || 'Video'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Patient', value: selected.patientName },
                { label: 'Patient Phone', value: selected.patientPhone || 'N/A' },
                { label: 'Doctor', value: selected.doctorName },
                { label: 'Duration', value: `${selected.duration || selected.durationMinutes || 30} minutes` },
                { label: 'Scheduled', value: selected.scheduledAt || selected.scheduledTime || 'N/A' },
                { label: 'Branch', value: selected.branch || 'Accra' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-medium text-[#0f172a] mt-0.5">{value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-slate-400">Chief Complaint</p>
                <p className="font-medium text-[#0f172a] mt-0.5">{selected.chiefComplaint || selected.notes || 'N/A'}</p>
              </div>

              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Session Notes</p>
                  <p className="text-sm text-slate-600 mt-0.5 bg-green-50 border border-green-100 rounded-lg p-3">{selected.notes}</p>
                </div>
              )}
              {selected.meetingLink && selected.status === 'Scheduled' && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Meeting Link</p>
                  <p className="text-sm text-[#1b4fce] font-mono mt-0.5">{selected.meetingLink}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Telemedicine Session" width="max-w-xl">
        <form onSubmit={handleSchedule} className="p-6 space-y-4">
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Session scheduled!</div>}
          <Select label="Patient *" required value={form.patientId} onChange={set('patientId')}>
            <option value="">Select patient...</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.mrn}</option>)}
          </Select>
          <Select label="Doctor *" required value={form.doctorId} onChange={set('doctorId')}>
            <option value="">Select doctor...</option>
            {availableDoctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || (d as any).fullName} {d.department ? `— ${d.department}` : ''} ({d.role})
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date &amp; Time *" type="datetime-local" required value={form.scheduledAt} onChange={set('scheduledAt')} />
            <Select label="Duration (minutes)" value={form.duration} onChange={set('duration')}>
              {['15', '20', '30', '45', '60'].map((d) => <option key={d}>{d}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Session Type" value={form.type} onChange={set('type')}>
              <option>Video</option><option>Audio</option><option>Chat</option>
            </Select>
            <Select label="Branch" value={form.branch} onChange={set('branch')}>
              <option>Accra</option><option>Mankessim</option>
            </Select>
          </div>
          <Textarea
            label="Chief Complaint / Reason *"
            placeholder="Describe why the patient is booking this session..."
            rows={2}
            required
            value={form.chiefComplaint}
            onChange={set('chiefComplaint')}
          />
          <div className="flex gap-2">
            <Button type="submit">Schedule Session</Button>
            <Button type="button" variant="secondary" onClick={() => setShowSchedule(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
