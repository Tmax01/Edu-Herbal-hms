import { useState } from 'react';
import { Branch } from '../../types';
import { Meeting } from '../../types/communication';
import { useAuth } from '../../contexts/AuthContext';
import { useMeetings } from '../../hooks/useMeetings';
import { useUsers } from '../../hooks/useUsers';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

type MeetingScope = 'Individual' | 'Branch' | 'Hospital-wide';

const scopeColors: Record<MeetingScope, string> = {
  Individual: 'bg-purple-50 border-purple-200 text-purple-700',
  Branch: 'bg-blue-50 border-blue-200 text-blue-700',
  'Hospital-wide': 'bg-teal-50 border-teal-200 text-teal-700',
};

const scopeIcons: Record<MeetingScope, string> = {
  Individual: '👤',
  Branch: '🏥',
  'Hospital-wide': '🌐',
};

const statusVariant = (s: string) => {
  if (s === 'Scheduled' || s === 'Upcoming') return 'default';
  if (s === 'In Progress') return 'warning';
  if (s === 'Completed') return 'success';
  return 'muted';
};


export default function MeetingsPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [branchFilter, setBranchFilter] = useState<'All' | Branch>('All');
  const { meetings: allMeetings, loading, scheduleMeeting, updateMeetingStatus } = useMeetings(branchFilter, activeTab);
  const { users: staffUsers } = useUsers(branchFilter === 'All' ? undefined : branchFilter);
  const canCreate = isAdmin();
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [filter, setFilter] = useState<'All' | MeetingScope>('All');
  const [minutes, setMinutes] = useState('');

  const [form, setForm] = useState({
    title: '', type: 'Staff Meeting', scope: 'Branch' as MeetingScope,
    targetBranch: 'Accra' as Branch, targetStaffId: '', date: '', time: '',
    duration: '60', location: '', agenda: '',
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [f]: e.target.value }));

  const upcoming = allMeetings.filter((m) => m.status === 'Scheduled' || m.status === 'In Progress');
  const past = allMeetings.filter((m) => m.status === 'Completed' || m.status === 'Cancelled');
  const displayList = (activeTab === 'upcoming' ? upcoming : past).filter((m) => {
    const scopeOk = filter === 'All' || m.scope === filter;
    const branchOk = branchFilter === 'All' || !m.branch || m.branch === branchFilter || m.branch === 'All';
    return scopeOk && branchOk;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await scheduleMeeting(
      {
        title: form.title,
        scheduledAt: `${form.date} ${form.time}`,
        durationMinutes: parseInt(form.duration, 10) || 60,
        location: form.location,
        scope: form.scope,
      },
      user?.name
    );
    setCreateSuccess(true);
    setTimeout(() => { setShowCreate(false); setCreateSuccess(false); setForm({ title: '', type: 'Staff Meeting', scope: 'Branch', targetBranch: 'Accra', targetStaffId: '', date: '', time: '', duration: '60', location: '', agenda: '' }); }, 1500);
  };

  const markComplete = async (id: string) => {
    await updateMeetingStatus(id, 'Completed', minutes || 'Meeting completed.');
    setShowDetail(false);
    setMinutes('');
  };


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Meetings & Scheduling</h2>
          <p className="text-sm text-slate-400">{upcoming.length} upcoming · {past.length} past</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} icon={<PlusIcon />}>Schedule Meeting</Button>
        )}
      </div>

      {/* Scope summary cards */}
      <div className="mb-5"><DepartmentGuide department="meetings" /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['Individual', 'Branch', 'Hospital-wide'] as MeetingScope[]).map((scope) => {
          const count = allMeetings.filter((m) => m.scope === scope && m.status === 'Upcoming').length;
          return (
            <button
              key={scope}
              onClick={() => setFilter(filter === scope ? 'All' : scope)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${scopeColors[scope]} ${filter === scope ? 'ring-2 ring-offset-1 ring-current' : ''}`}
            >
              <span className="text-3xl">{scopeIcons[scope]}</span>
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{count}</p>
                <p className="text-xs font-semibold mt-0.5">{scope} {scope === 'Individual' ? 'Sessions' : 'Meetings'}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tabs + filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex bg-[#f0f4f8] rounded-lg p-0.5">
          {(['upcoming', 'past'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${activeTab === t ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}>{t === 'upcoming' ? '📅 Upcoming' : '📋 Past'}</button>
          ))}
        </div>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value as 'All' | Branch)}
          className="px-3 py-1.5 text-xs border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]">
          <option value="All">All Branches</option>
          <option value="Accra">Accra</option>
          <option value="Mankessim">Mankessim</option>
        </select>
      </div>

      {/* Meeting cards */}
      <div className="space-y-3">
        {displayList.map((mtg) => (
          <div
            key={mtg.id}
            className="bg-white rounded-xl border border-[#dbe4ef] p-5 hover:shadow-md transition-all cursor-pointer"
            onClick={() => { setSelected(mtg); setShowDetail(true); setMinutes(''); }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border ${scopeColors[mtg.scope]}`}>
                  {scopeIcons[mtg.scope]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{mtg.title}</h3>
                    <Badge variant={statusVariant(mtg.status)}>{mtg.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500">📅 {mtg.date || mtg.scheduledAt} {mtg.time ? `at ${mtg.time}` : ''}</span>
                    <span className="text-xs text-slate-500">⏱ {mtg.duration || `${mtg.durationMinutes || 60} min`}</span>
                    <span className="text-xs text-slate-500">📍 {mtg.location || 'Conference Room'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${scopeColors[mtg.scope]}`}>{mtg.scope}</span>
                    {(mtg.targetBranch || mtg.branch) && <span className="text-[10px] text-slate-400">Branch: {mtg.targetBranch || mtg.branch}</span>}
                    <span className="text-[10px] text-slate-400">Organised by {mtg.organizer || mtg.organizerName || 'Admin'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-400">{mtg.type || 'Staff Meeting'}</p>
                <p className="text-xs text-slate-400 mt-1">{(mtg.attendees || []).length} attendee{(mtg.attendees || []).length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Attendee pills */}
            {(mtg.attendees || []).length > 0 && (mtg.attendees || []).length <= 6 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#f0f4f8]">
                {(mtg.attendees || []).map((att: string, i: number) => (
                  <span key={i} className="text-[10px] bg-[#f0f4f8] text-slate-600 px-2 py-1 rounded-full font-medium">{att}</span>
                ))}
              </div>
            )}
            {(mtg.attendees || []).length > 6 && (
              <div className="mt-3 pt-3 border-t border-[#f0f4f8]">
                <span className="text-xs text-slate-400">👥 {(mtg.attendees || [])[0]}</span>
              </div>
            )}
          </div>
        ))}
        {displayList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📅</p>
            <p className="text-slate-400 text-sm">No {activeTab} meetings found</p>
            {canCreate && <Button className="mt-3" size="sm" onClick={() => setShowCreate(true)}>Schedule one now</Button>}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title={selected?.title ?? ''} width="max-w-2xl">
        {selected && (
          <div className="p-6 space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${scopeColors[selected.scope]}`}>
              <span className="text-2xl">{scopeIcons[selected.scope]}</span>
              <div>
                <p className="font-semibold text-sm">{selected.scope} — {selected.type || 'Staff Meeting'}</p>
                <p className="text-xs mt-0.5">{selected.date || selected.scheduledAt} {selected.time ? `at ${selected.time}` : ''} · {selected.duration || `${selected.durationMinutes || 60} min`}</p>
              </div>
              <Badge className="ml-auto" variant={statusVariant(selected.status)}>{selected.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400">Organiser</p><p className="font-medium">{selected.organizer || selected.organizerName || 'Admin'}</p></div>
              <div><p className="text-xs text-slate-400">Location</p><p className="font-medium">{selected.location || 'Conference Room'}</p></div>
              <div><p className="text-xs text-slate-400">Branch Scope</p><p className="font-medium">{selected.targetBranch || selected.branch || (selected.scope === 'Hospital-wide' ? 'All Branches' : '—')}</p></div>
              <div><p className="text-xs text-slate-400">Duration</p><p className="font-medium">{selected.duration || `${selected.durationMinutes || 60} min`}</p></div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Agenda</p>
              <pre className="text-sm text-slate-700 bg-[#f8fafc] p-3 rounded-xl whitespace-pre-wrap border border-[#dbe4ef] font-sans leading-relaxed">{selected.agenda || selected.minutes || 'Standard departmental agenda'}</pre>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Attendees ({(selected.attendees || []).length})</p>
              <div className="flex flex-wrap gap-1.5">
                {(selected.attendees || []).map((a: string, i: number) => (
                  <span key={i} className="text-xs bg-[#f0f4f8] text-slate-700 px-2.5 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>


            {selected.minutes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Meeting Minutes</p>
                <p className="text-sm text-slate-700 bg-green-50 border border-green-200 p-3 rounded-xl leading-relaxed">{selected.minutes}</p>
              </div>
            )}

            {canCreate && (selected.status === 'Scheduled' || selected.status === 'Upcoming') && (
              <div className="border-t border-[#f0f4f8] pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mark as Completed</p>
                <Textarea label="Meeting Minutes / Notes" placeholder="Record what was discussed and decided..." rows={3} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="teal" size="sm" onClick={() => markComplete(selected.id)}>Complete Meeting</Button>
                  <Button variant="danger" size="sm" onClick={async () => { await updateMeetingStatus(selected.id, 'Cancelled'); setShowDetail(false); }}>Cancel Meeting</Button>
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Schedule Meeting" width="max-w-2xl">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {createSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Meeting scheduled and invitations sent!</div>}

          <Input label="Meeting Title *" placeholder="e.g. Monthly Clinical Review" required value={form.title} onChange={set('title')} />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Meeting Type *" required value={form.type} onChange={set('type')}>
              {['Staff Meeting', 'Performance Review', 'Training', 'Department Briefing', 'Emergency Meeting', 'Board Meeting'].map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Select label="Scope *" required value={form.scope} onChange={set('scope')}>
              <option value="Individual">👤 Individual Staff</option>
              <option value="Branch">🏥 Branch Meeting</option>
              <option value="Hospital-wide">🌐 Hospital-wide</option>
            </Select>
          </div>

          {form.scope === 'Individual' && (
            <Select label="Select Staff Member *" required value={form.targetStaffId} onChange={set('targetStaffId')}>
              <option value="">Choose staff...</option>
              {staffUsers.filter((u) => u.id !== user?.id).map((u) => (
                <option key={u.id} value={u.id}>{(u.name || (u as any).fullName)} — {u.department} ({u.branch})</option>
              ))}
            </Select>
          )}

          {form.scope === 'Branch' && (
            <Select label="Target Branch *" required value={form.targetBranch} onChange={set('targetBranch')}>
              <option value="Accra">Accra Branch</option>
              <option value="Mankessim">Mankessim Branch</option>
            </Select>
          )}

          {form.scope === 'Hospital-wide' && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
              <p className="text-xs text-teal-700 font-medium">🌐 This meeting will notify all staff across both Accra and Mankessim branches.</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Input label="Date *" type="date" required value={form.date} onChange={set('date')} />
            <Input label="Time *" type="time" required value={form.time} onChange={set('time')} />
            <Select label="Duration" value={form.duration} onChange={set('duration')}>
              {['30 minutes', '45 minutes', '1 hour', '1.5 hours', '2 hours', '3 hours', '4 hours', 'Half day', 'Full day'].map((d) => <option key={d}>{d}</option>)}
            </Select>
          </div>

          <Input label="Location *" placeholder="e.g. Conference Room A, Accra / Video Call" required value={form.location} onChange={set('location')} />
          <Textarea label="Agenda *" placeholder="1. Item one&#10;2. Item two&#10;3. Any Other Business" rows={4} required value={form.agenda} onChange={set('agenda')} />

          <div className="flex gap-2 pt-2">
            <Button type="submit">Schedule Meeting</Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
