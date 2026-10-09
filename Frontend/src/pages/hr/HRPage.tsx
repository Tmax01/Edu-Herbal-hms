import { useState } from 'react';
import { LeaveRequest, OffDutyRequest } from '../../types/hr';
import { useAuth } from '../../contexts/AuthContext';
import { useHR } from '../../hooks/useHR';
import { useUsers } from '../../hooks/useUsers';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

type HRTab = 'staff' | 'leave' | 'offduty' | 'departments';

export default function HRPage() {
  const { user, activeBranch, isAdmin } = useAuth();
  const [tab, setTab] = useState<HRTab>('staff');
  const { users: staffUsers } = useUsers(activeBranch);
  const {
    leaves,
    offDuties,
    applyLeave,
    applyOffDuty,
    approveLeave: doApproveLeave,
    rejectLeave: doRejectLeave,
    approveOffDuty: doApproveOD,
    rejectOffDuty: doRejectOD,
  } = useHR(activeBranch, !isAdmin(), user?.id);

  const [showLeave, setShowLeave] = useState(false);
  const [showOffDuty, setShowOffDuty] = useState(false);
  const [leaveSaved, setLeaveSaved] = useState(false);
  const [offDutySaved, setOffDutySaved] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'Annual', from: '', to: '', reason: '' });
  const [offDutyForm, setOffDutyForm] = useState({ date: '', shiftType: 'Morning' as OffDutyRequest['shiftType'], reason: '' });

  const setLF = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setLeaveForm((p) => ({ ...p, [f]: e.target.value }));
  const setODF = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setOffDutyForm((p) => ({ ...p, [f]: e.target.value }));

  const filteredStaff = staffUsers.filter((u) => activeBranch === 'All' || !u.branch || u.branch === activeBranch || u.branch === 'All');
  const filteredLeaves = leaves.filter((l) => isAdmin() ? (activeBranch === 'All' || !l.branch || l.branch === activeBranch) : l.staffId === user?.id);
  const filteredOffDuties = offDuties.filter((o) => isAdmin() ? (activeBranch === 'All' || !o.branch || o.branch === activeBranch) : o.staffId === user?.id);

  const handleLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await applyLeave(
      {
        leaveType: leaveForm.type as LeaveRequest['type'],
        startDate: leaveForm.from,
        endDate: leaveForm.to,
        reason: leaveForm.reason,
      },
      user.name,
      activeBranch
    );
    setLeaveSaved(true);
    setTimeout(() => { setShowLeave(false); setLeaveSaved(false); setLeaveForm({ type: 'Annual', from: '', to: '', reason: '' }); }, 1400);
  };

  const handleOffDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await applyOffDuty(
      {
        requestedDate: offDutyForm.date,
        shiftType: offDutyForm.shiftType,
        reason: offDutyForm.reason,
      },
      user.name,
      user.department,
      activeBranch
    );
    setOffDutySaved(true);
    setTimeout(() => { setShowOffDuty(false); setOffDutySaved(false); setOffDutyForm({ date: '', shiftType: 'Morning', reason: '' }); }, 1400);
  };

  const approveLeave = async (id: string) => await doApproveLeave(id, 'Approved', user?.name);
  const rejectLeave = async (id: string) => await doRejectLeave(id, 'Rejected');
  const approveOD = async (id: string) => await doApproveOD(id, user?.name);
  const rejectOD = async (id: string) => await doRejectOD(id);


  const departments = [...new Set(filteredStaff.map((u) => u.department))].filter(Boolean);

  const tabs: { id: HRTab; label: string; icon: string; badge?: number }[] = [
    { id: 'staff', label: 'Staff Directory', icon: '👥' },
    { id: 'leave', label: 'Leave Requests', icon: '🗓️', badge: filteredLeaves.filter((l) => l.status === 'Pending').length },
    { id: 'offduty', label: 'Off-Duty Requests', icon: '🔄', badge: filteredOffDuties.filter((o) => o.status === 'Pending').length },
    { id: 'departments', label: 'Departments', icon: '🏢' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Human Resources</h2>
          <p className="text-sm text-slate-400">{filteredStaff.filter((u) => u.active).length} active staff · {activeBranch === 'All' ? 'All branches' : activeBranch}</p>
        </div>
        {tab === 'leave' && (
          <Button size="sm" onClick={() => setShowLeave(true)} icon={<PlusIcon />}>Apply for Leave</Button>
        )}
        {tab === 'offduty' && (
          <Button size="sm" variant="teal" onClick={() => setShowOffDuty(true)} icon={<PlusIcon />}>Apply for Off-Duty</Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="mb-5"><DepartmentGuide department="hr" /></div>
      <div className="flex gap-1 bg-[#f0f4f8] rounded-xl p-1 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${tab === t.id ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}>
            <span>{t.icon}</span>{t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* STAFF DIRECTORY */}
      {tab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((u) => (
            <div key={u.id} className={`bg-white rounded-xl border border-[#dbe4ef] p-4 ${!u.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a] truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.department}</p>
                </div>
                <Badge variant={u.active ? 'success' : 'muted'} className="shrink-0">{u.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2"><span>🎭</span><span className="capitalize">{u.role.replace('_', ' ')}</span></div>
                <div className="flex items-center gap-2"><span>📍</span><span>{u.branch}</span></div>
                <div className="flex items-center gap-2"><span>📞</span><span>{u.phone}</span></div>
                <div className="flex items-center gap-2"><span>✉️</span><span className="truncate font-mono">{u.email}</span></div>
              </div>
              <div className="mt-3 pt-2 border-t border-[#f0f4f8] flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                <span className="text-[10px] text-slate-400">Last: {u.lastLogin}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LEAVE MANAGEMENT */}
      {tab === 'leave' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-2">
            {[
              { label: 'Pending', count: filteredLeaves.filter((l) => l.status === 'Pending').length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { label: 'Approved', count: filteredLeaves.filter((l) => l.status === 'Approved').length, color: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Rejected', count: filteredLeaves.filter((l) => l.status === 'Rejected').length, color: 'bg-red-50 border-red-200 text-red-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f4f8]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  {isAdmin() && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f8]">
                {filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-[#f8fafc]">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#0f172a]">{l.staffName}</p>
                      <p className="text-xs text-slate-400">{l.branch}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-[#e8eef7] text-[#1b4fce] px-2 py-0.5 rounded">{l.type}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-slate-600">{l.from} → {l.to}</p>
                      <p className="text-[10px] text-slate-400">{l.days} day{l.days > 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-slate-500 max-w-[200px] truncate">{l.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}>{l.status}</Badge>
                        {l.approvedBy && <p className="text-[10px] text-slate-400 mt-0.5">by {l.approvedBy}</p>}
                      </div>
                    </td>
                    {isAdmin() && (
                      <td className="px-4 py-3">
                        {l.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approveLeave(l.id)} className="text-xs text-green-600 hover:underline font-medium">Approve</button>
                            <button onClick={() => rejectLeave(l.id)} className="text-xs text-red-500 hover:underline">Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filteredLeaves.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">No leave requests found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFF-DUTY REQUESTS */}
      {tab === 'offduty' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-2">
            {[
              { label: 'Pending', count: filteredOffDuties.filter((o) => o.status === 'Pending').length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { label: 'Approved', count: filteredOffDuties.filter((o) => o.status === 'Approved').length, color: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Rejected', count: filteredOffDuties.filter((o) => o.status === 'Rejected').length, color: 'bg-red-50 border-red-200 text-red-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f4f8]">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date &amp; Shift</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  {isAdmin() && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f8]">
                {filteredOffDuties.map((o) => (
                  <tr key={o.id} className="hover:bg-[#f8fafc]">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#0f172a]">{o.staffName}</p>
                      <p className="text-xs text-slate-400">{o.department} · {o.branch}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-600 font-medium">{o.date}</p>
                      <span className="text-[10px] font-medium bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">{o.shiftType}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-slate-500 max-w-[200px] truncate">{o.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <Badge variant={o.status === 'Approved' ? 'success' : o.status === 'Rejected' ? 'danger' : 'warning'}>{o.status}</Badge>
                        {o.approvedBy && <p className="text-[10px] text-slate-400 mt-0.5">by {o.approvedBy}</p>}
                      </div>
                    </td>
                    {isAdmin() && (
                      <td className="px-4 py-3">
                        {o.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approveOD(o.id)} className="text-xs text-green-600 hover:underline font-medium">Approve</button>
                            <button onClick={() => rejectOD(o.id)} className="text-xs text-red-500 hover:underline">Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filteredOffDuties.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No off-duty requests found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENTS */}
      {tab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => {
            const deptStaff = filteredStaff.filter((u) => u.department === dept);
            return (
              <div key={dept} className="bg-white rounded-xl border border-[#dbe4ef] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#0f172a] text-sm">{dept}</h3>
                  <span className="text-xs bg-[#e8eef7] text-[#1b4fce] px-2 py-0.5 rounded-full font-medium">{deptStaff.length} staff</span>
                </div>
                <div className="space-y-2">
                  {deptStaff.map((u) => (
                    <div key={u.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                        {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0f172a] truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.role.replace('_', ' ')}</p>
                      </div>
                      {!u.active && <Badge variant="muted" className="text-[9px]">Inactive</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leave Modal */}
      <Modal open={showLeave} onClose={() => setShowLeave(false)} title="Apply for Leave">
        <form onSubmit={handleLeave} className="p-6 space-y-4">
          {leaveSaved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Leave application submitted! Pending approval.</div>}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
            Submitting as: <strong>{user?.name}</strong> · {user?.department}
          </div>
          <Select label="Leave Type *" required value={leaveForm.type} onChange={setLF('type')}>
            {['Annual', 'Sick', 'Maternity', 'Study', 'Emergency'].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="From *" type="date" required value={leaveForm.from} onChange={setLF('from')} />
            <Input label="To *" type="date" required value={leaveForm.to} onChange={setLF('to')} />
          </div>
          <Textarea label="Reason *" placeholder="Briefly explain your reason for leave..." rows={2} required value={leaveForm.reason} onChange={setLF('reason')} />
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Your application will be reviewed by Admin or CTO. You will be notified of the decision.
          </div>
          <div className="flex gap-2">
            <Button type="submit">Submit Application</Button>
            <Button type="button" variant="secondary" onClick={() => setShowLeave(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Off-Duty Modal */}
      <Modal open={showOffDuty} onClose={() => setShowOffDuty(false)} title="Apply for Off-Duty">
        <form onSubmit={handleOffDuty} className="p-6 space-y-4">
          {offDutySaved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Off-duty request submitted! Pending approval.</div>}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
            Submitting as: <strong>{user?.name}</strong> · {user?.department}
          </div>
          <Input label="Date *" type="date" required value={offDutyForm.date} onChange={setODF('date')} />
          <Select label="Shift *" required value={offDutyForm.shiftType} onChange={setODF('shiftType')}>
            {(['Morning', 'Afternoon', 'Night', 'Full Day'] as OffDutyRequest['shiftType'][]).map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Textarea label="Reason *" placeholder="Brief reason for off-duty request..." rows={2} required value={offDutyForm.reason} onChange={setODF('reason')} />
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Off-duty requests require approval from Admin or CTO. Please ensure your shift is covered.
          </div>
          <div className="flex gap-2">
            <Button type="submit">Submit Request</Button>
            <Button type="button" variant="secondary" onClick={() => setShowOffDuty(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
