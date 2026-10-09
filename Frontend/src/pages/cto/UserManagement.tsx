import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState, useRef } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { StaffUser, Role, Branch, Module } from '../../types';
import { defaultModulesByRole, roleLabels } from '../../constants/system';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';

interface StaffExtras {
  cvFileName?: string;
  cvDataUrl?: string;
  appointmentLetterSent?: boolean;
  appointmentLetterDate?: string;
  photo?: string;
}

const LETTER_TEMPLATE = (user: StaffUser) => `EDHEC Health Management System
Accra & Mankessim Branches
Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

APPOINTMENT LETTER

Dear ${user.name},

We are pleased to inform you that you have been appointed to the position of ${roleLabels[user.role]} at EDHEC HMS, ${user.branch === 'All' ? 'All Branches' : `${user.branch} Branch`}, effective from ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.

Your employment details are as follows:
  • Staff ID:     ${user.id}
  • Department:   ${user.department || roleLabels[user.role]}
  • Email:        ${user.email}
  • Phone:        ${user.phone}
  • Branch:       ${user.branch === 'All' ? 'All Branches' : user.branch}

Please report to the Administration Office on your first day with the following documents:
  1. Two passport photographs
  2. Academic certificates (originals and photocopies)
  3. Valid National ID / Ghana Card
  4. Tax Identification Number (TIN)
  5. Bank account details for payroll

Terms and conditions of employment will be provided separately in your employment contract.

We look forward to a productive working relationship.

Yours faithfully,

_______________________________
CTO / Chief Administrative Officer
EDHEC Health Management System`;

export default function UserManagement() {
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const {
    users,
    toggleUserActive,
    createStaffUser,
    resetPassword,
    uploadCv,
    sendAppointmentLetter,
    loading,
  } = useUsers('All', roleFilter);
  const [extras, setExtras] = useState<Record<string, StaffExtras>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resettingPw, setResettingPw] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [letterSent, setLetterSent] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'doctor' as Role, branch: 'Accra' as Branch, department: '', phone: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStaffUser({
      fullName: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      primaryBranchId: form.branch === 'Mankessim' ? 'mankessim-branch-002' : 'accra-main-branch-001',
      phone: form.phone,
    });
    setCreatedSuccess(true);
    setTimeout(() => { setShowCreate(false); setCreatedSuccess(false); setForm({ name: '', email: '', password: '', role: 'doctor', branch: 'Accra', department: '', phone: '' }); }, 1500);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setResettingPw(true);
    setResetError(null);
    try {
      await resetPassword(selectedUser.id, newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setShowReset(false);
        setResetSuccess(false);
        setNewPassword('');
        setSelectedUser(null);
      }, 1500);
    } catch (err: any) {
      setResetError(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setResettingPw(false);
    }
  };

  const toggleActive = async (id: string) => {
    await toggleUserActive(id);
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        await uploadCv(selectedUser.id, file.name, dataUrl);
      } catch (err) {
        console.warn('CV upload warning:', err);
      }
      setExtras((prev) => ({
        ...prev,
        [selectedUser.id]: { ...prev[selectedUser.id], cvFileName: file.name, cvDataUrl: dataUrl },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSendLetter = async () => {
    if (!selectedUser) return;
    setLetterSent(true);
    try {
      await sendAppointmentLetter(selectedUser.id);
    } catch (err) {
      console.warn('Send appointment letter error:', err);
    }
    setExtras((prev) => ({
      ...prev,
      [selectedUser.id]: {
        ...prev[selectedUser.id],
        appointmentLetterSent: true,
        appointmentLetterDate: new Date().toISOString().slice(0, 10),
      },
    }));
    setTimeout(() => setLetterSent(false), 2000);
  };

  const roleColors: Record<Role, string> = {
    cto: 'navy', admin: 'default', doctor: 'teal', nurse: 'info', pharmacist: 'success',
    lab_tech: 'warning', receptionist: 'muted', accountant: 'muted', call_centre: 'info', store_officer: 'muted', hr: 'purple',
  };

  const filtered = users.filter((u) => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchQ && matchRole;
  });

  const openDetail = (u: StaffUser) => { setSelectedUser(u); setShowDetail(true); };

  const selExtras = selectedUser ? (extras[selectedUser.id] ?? {}) : {};

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>User Management</h2>
          <p className="text-sm text-slate-400">{users.filter((u) => u.active).length} active · {users.filter((u) => !u.active).length} inactive · {users.length} total staff</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<PlusIcon />} className="w-full sm:w-auto">Create Staff Account</Button>
      </div>

      <div className="mb-5"><DepartmentGuide department="user_management" /></div>

      {/* CTO notice */}
      <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
          <ShieldIcon />
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-900">CTO Access Panel</p>
          <p className="text-xs text-purple-600">Full control over staff accounts: create, reset passwords, set access rules, upload CVs, send appointment letters.</p>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#1b4fce]/20"
            placeholder="Search staff by name, email or department…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-[#dbe4ef] rounded-lg bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-[#1b4fce]/20"
        >
          <option value="All">All Roles</option>
          {(Object.entries(roleLabels) as [Role, string][]).map(([r, l]) => (
            <option key={r} value={r}>{l}</option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-[#dbe4ef] overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f8]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff Member</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role / Dept</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Last Login</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Docs</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f8]">
            {filtered.map((u) => {
              const ex = extras[u.id] ?? {};
              return (
                <tr key={u.id} className={`hover:bg-[#f8fafc] transition-colors ${!u.active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden">
                        {ex.photo ? <img src={ex.photo} alt="" className="w-full h-full object-cover" /> : u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <button className="text-sm font-medium text-[#1b4fce] hover:underline text-left" onClick={() => openDetail(u)}>{u.name}</button>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                        <p className="text-[10px] text-slate-300 font-mono">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleColors[u.role] as 'default'}>{roleLabels[u.role]}</Badge>
                    {u.department && <p className="text-[10px] text-slate-400 mt-0.5">{u.department}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">{u.branch}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-slate-500 font-mono">{u.lastLogin}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ex.cvFileName || (u as any).cvFileName ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                        {ex.cvFileName || (u as any).cvFileName ? '📎 CV' : 'No CV'}
                      </span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${ex.appointmentLetterSent || (u as any).appointmentLetterSent ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {ex.appointmentLetterSent || (u as any).appointmentLetterSent ? '✉️ Sent' : 'No Letter'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.active ? 'success' : 'muted'}>{u.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => openDetail(u)} className="text-xs text-[#1b4fce] hover:underline font-medium text-left">View Details</button>
                      <button onClick={() => { setSelectedUser(u); setShowReset(true); }} className="text-xs text-amber-600 hover:underline font-medium text-left">Reset PW</button>
                      <button onClick={() => toggleActive(u.id)} className={`text-xs font-medium hover:underline text-left ${u.active ? 'text-red-500' : 'text-green-600'}`}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No staff match your search</p>}
      </div>

      {/* Mobile card view */}
      <div className="md:hidden space-y-3 mb-4">
        {filtered.map((u) => {
          const ex = extras[u.id] ?? {};
          return (
            <div key={u.id} className={`bg-white rounded-xl border border-[#dbe4ef] p-4 ${!u.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {ex.photo ? <img src={ex.photo} alt="" className="w-full h-full object-cover" /> : u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <button className="text-sm font-semibold text-[#1b4fce] hover:underline text-left truncate block w-full" onClick={() => openDetail(u)}>{u.name}</button>
                  <p className="text-xs text-slate-400 font-mono truncate">{u.email}</p>
                  <p className="text-[10px] text-slate-300 font-mono">{u.id}</p>
                </div>
                <Badge variant={u.active ? 'success' : 'muted'}>{u.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant={roleColors[u.role] as 'default'}>{roleLabels[u.role]}</Badge>
                <span className="text-xs text-slate-500 bg-[#f0f4f8] px-2 py-0.5 rounded-full">{u.branch}</span>
                {u.department && <span className="text-xs text-slate-500 bg-[#f0f4f8] px-2 py-0.5 rounded-full">{u.department}</span>}
              </div>
              <div className="flex gap-2 mb-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ex.cvFileName ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                  {ex.cvFileName ? `📎 ${ex.cvFileName}` : 'No CV'}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ex.appointmentLetterSent ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                  {ex.appointmentLetterSent ? '✉️ Letter Sent' : 'No Letter'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-3">Last login: <span className="font-mono">{u.lastLogin}</span></p>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#f0f4f8]">
                <button onClick={() => openDetail(u)} className="py-2 text-xs font-semibold text-[#1b4fce] bg-blue-50 border border-blue-200 rounded-lg">View Details</button>
                <button onClick={() => { setSelectedUser(u); setShowReset(true); }} className="py-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg">Reset Password</button>
                <button onClick={() => toggleActive(u.id)} className={`col-span-2 py-2 text-xs font-semibold rounded-lg border transition-colors ${u.active ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
                  {u.active ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No staff match your search</p>}
      </div>

      {/* ── Staff Detail Modal ─────────────────────────────────────────────── */}
      <Modal open={showDetail && !!selectedUser} onClose={() => { setShowDetail(false); setSelectedUser(null); }} title="Staff Profile & Documents" width="max-w-2xl">
        {selectedUser && (
          <div className="p-6 space-y-5">
            {/* Header card */}
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#f0f4f8] to-[#e8eef7] rounded-xl border border-[#dbe4ef]">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden">
                {selExtras.photo ? <img src={selExtras.photo} alt="" className="w-full h-full object-cover" /> : selectedUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{selectedUser.name}</h3>
                  <Badge variant={roleColors[selectedUser.role] as 'default'}>{roleLabels[selectedUser.role]}</Badge>
                  <Badge variant={selectedUser.active ? 'success' : 'muted'}>{selectedUser.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono">{selectedUser.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedUser.department} · {selectedUser.branch === 'All' ? 'All Branches' : `${selectedUser.branch} Branch`}</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Staff ID', value: selectedUser.id, mono: true },
                { label: 'Phone', value: selectedUser.phone },
                { label: 'Branch', value: selectedUser.branch },
                { label: 'Department', value: selectedUser.department || '—' },
                { label: 'Joined', value: selectedUser.createdAt },
                { label: 'Last Login', value: selectedUser.lastLogin, mono: true },
                { label: 'Modules Access', value: `${selectedUser.allowedModules.length} modules` },
                { label: 'Account Status', value: selectedUser.active ? 'Active' : 'Inactive' },
              ].map(({ label, value, mono }) => (
                <div key={label} className="p-3 bg-[#f8fafc] rounded-lg border border-[#dbe4ef]">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className={`text-sm font-semibold text-[#0f172a] mt-0.5 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* CV Upload section */}
            <div className="rounded-xl border border-[#dbe4ef] overflow-hidden">
              <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#dbe4ef] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📎</span>
                  <p className="text-sm font-semibold text-[#0f172a]">Curriculum Vitae (CV)</p>
                </div>
                {selExtras.cvFileName && (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">Uploaded</span>
                )}
              </div>
              <div className="p-4">
                {selExtras.cvFileName ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-600 text-xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-800 truncate">{selExtras.cvFileName}</p>
                      <p className="text-xs text-green-600">CV successfully attached to staff profile</p>
                    </div>
                    <button
                      onClick={() => setExtras((prev) => ({ ...prev, [selectedUser.id]: { ...prev[selectedUser.id], cvFileName: undefined, cvDataUrl: undefined } }))}
                      className="text-xs text-red-500 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-[#dbe4ef] rounded-xl p-6 text-center cursor-pointer hover:border-[#1b4fce] hover:bg-blue-50/30 transition-all"
                    onClick={() => cvInputRef.current?.click()}
                  >
                    <div className="text-3xl mb-2">📂</div>
                    <p className="text-sm font-medium text-slate-600">Click to upload CV</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX · Max 10MB</p>
                  </div>
                )}
                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleCVUpload}
                />
                {!selExtras.cvFileName && (
                  <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => cvInputRef.current?.click()}>
                    Upload CV / Resume
                  </Button>
                )}
              </div>
            </div>

            {/* Appointment Letter section */}
            <div className="rounded-xl border border-[#dbe4ef] overflow-hidden">
              <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#dbe4ef] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">✉️</span>
                  <p className="text-sm font-semibold text-[#0f172a]">Appointment Letter</p>
                </div>
                {selExtras.appointmentLetterSent && (
                  <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">Sent {selExtras.appointmentLetterDate}</span>
                )}
              </div>
              <div className="p-4 space-y-3">
                {selExtras.appointmentLetterSent && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    ✓ Appointment letter was sent to <strong>{selectedUser.email}</strong> on {selExtras.appointmentLetterDate}
                  </div>
                )}
                {letterSent && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
                    ✓ Appointment letter sent to {selectedUser.email}
                  </div>
                )}
                <div className="p-3 bg-[#f8fafc] border border-[#dbe4ef] rounded-lg">
                  <pre className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                    {LETTER_TEMPLATE(selectedUser).slice(0, 400)}…
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => { setShowDetail(false); setShowLetter(true); }}
                  >
                    Preview Full Letter
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSendLetter}
                  >
                    {selExtras.appointmentLetterSent ? 'Resend Letter' : 'Send Letter'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick actions footer */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#dbe4ef]">
              <Button size="sm" variant="secondary" onClick={() => { setShowDetail(false); setShowReset(true); }}>Reset Password</Button>
              <Button size="sm" variant={selectedUser.active ? 'danger' : 'secondary'} onClick={() => { toggleActive(selectedUser.id); setShowDetail(false); }}>
                {selectedUser.active ? 'Deactivate Account' : 'Activate Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Appointment Letter Preview Modal */}
      <Modal open={showLetter && !!selectedUser} onClose={() => { setShowLetter(false); setShowDetail(true); }} title="Appointment Letter Preview" width="max-w-2xl">
        {selectedUser && (
          <div className="p-6">
            {letterSent && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Letter sent to {selectedUser.email}</div>
            )}
            <div className="bg-white border border-[#dbe4ef] rounded-xl p-6 mb-4">
              <pre className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-mono">{LETTER_TEMPLATE(selectedUser)}</pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSendLetter}>
                {selExtras.appointmentLetterSent ? 'Resend to Staff Email' : 'Send to Staff Email'}
              </Button>
              <Button variant="secondary" onClick={() => {
                const blob = new Blob([LETTER_TEMPLATE(selectedUser)], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `Appointment_Letter_${selectedUser.name.replace(/\s+/g, '_')}.txt`;
                a.click();
              }}>Download Letter</Button>
              <Button variant="secondary" onClick={() => { setShowLetter(false); setShowDetail(true); }}>Back</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Staff Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Staff Account" width="max-w-xl">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {createdSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Staff account created! Credentials: {form.email} / {form.password}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Input label="Full Name *" placeholder="e.g. Kofi Mensah" required value={form.name} onChange={set('name')} />
            </div>
            <div className="col-span-2">
              <Input label="Email (Staff ID) *" type="email" placeholder="name@eduhms.gh" required value={form.email} onChange={set('email')} />
            </div>
            <Input label="Initial Password *" type="text" placeholder="Strong password" required value={form.password} onChange={set('password')} />
            <Input label="Phone" placeholder="+233 xx xxx xxxx" value={form.phone} onChange={set('phone')} />
            <Select label="Role *" required value={form.role} onChange={set('role') as (e: React.ChangeEvent<HTMLSelectElement>) => void}>
              {(Object.keys(roleLabels) as Role[]).map((r) => (
                <option key={r} value={r}>{roleLabels[r]}</option>
              ))}
            </Select>
            <Select label="Branch *" required value={form.branch} onChange={set('branch') as (e: React.ChangeEvent<HTMLSelectElement>) => void}>
              <option value="Accra">Accra</option>
              <option value="Mankessim">Mankessim</option>
              <option value="All">All Branches</option>
            </Select>
            <div className="col-span-2">
              <Input label="Department" placeholder="e.g. General Medicine, Pharmacy" value={form.department} onChange={set('department')} />
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">Default access for <strong>{roleLabels[form.role]}</strong> will be applied. Customise access in the Access Control panel.</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Create Account</Button>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={showReset} onClose={() => { setShowReset(false); setSelectedUser(null); setNewPassword(''); setResetError(null); }} title="Reset Staff Password">
        <form onSubmit={handleReset} className="p-6 space-y-4">
          {resetSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Password reset successfully!</div>}
          {resetError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">✕ {resetError}</div>}
          {selectedUser && (
            <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#dbe4ef]">
              <p className="text-sm font-semibold text-[#0f172a]">{selectedUser.name}</p>
              <p className="text-xs text-slate-400 font-mono">{selectedUser.email} · {selectedUser.id}</p>
            </div>
          )}
          <Input
            label="New Password *"
            type="text"
            placeholder="Enter new password (min. 6 characters)"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700">⚠️ Notify the staff member of their new password directly. This action is logged in the audit trail.</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={resettingPw}>
              {resettingPw ? 'Resetting…' : 'Reset Password'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setShowReset(false); setSelectedUser(null); setNewPassword(''); setResetError(null); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function ShieldIcon() { return <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none"><path d="M8 1l6 2.5v5C14 11 11 13.5 8 15c-3-1.5-6-4-6-6.5v-5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
