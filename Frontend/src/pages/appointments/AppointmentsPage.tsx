import { useState } from 'react';
import { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../hooks/useAppointments';
import { useUsers } from '../../hooks/useUsers';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

export default function AppointmentsPage() {
  const { activeBranch } = useAuth();
  const [view, setView] = useState<'queue' | 'calendar'>('queue');
  const [showBook, setShowBook] = useState(false);
  const [filterDate, setFilterDate] = useState('2026-08-22');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [bookForm, setBookForm] = useState({ patient: '', doctor: '', department: '', date: '2026-08-22', time: '', notes: '' });
  const [booked, setBooked] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const { users: staffUsers } = useUsers(activeBranch);
  const { appointments, loading, error, updateStatus, createAppointment } = useAppointments(filterDate, filterDoctor, activeBranch);

  const doctors = staffUsers.filter((u) => u.role === 'doctor' && (activeBranch === 'All' || u.branch === activeBranch || u.branch === 'All'));
  const availableProviders = doctors.length > 0 ? doctors : staffUsers;

  const statusOrder = ['Checked-in', 'In Progress', 'Scheduled', 'Completed', 'No-show'];
  const sorted = [...appointments].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));

  const setBook = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setBookForm((f) => ({ ...f, [field]: e.target.value }));

  const advanceStatus = async (id: string, next: Appointment['status']) => {
    await updateStatus(id, next);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    const selectedDoctor = doctors.find((d) => d.id === bookForm.doctor);

    await createAppointment({
      patientName: bookForm.patient,
      doctorId: bookForm.doctor,
      doctorName: selectedDoctor?.name ?? 'TBD',
      department: selectedDoctor?.department ?? bookForm.department ?? 'General Medicine',
      date: bookForm.date,
      time: bookForm.time || '09:00',
      reason: bookForm.notes,
      notes: bookForm.notes,
      branch: activeBranch === 'All' ? 'Accra' : activeBranch,
    });

    setBooked(true);
    setBookingLoading(false);
    setTimeout(() => {
      setShowBook(false);
      setBooked(false);
      setBookForm({ patient: '', doctor: '', department: '', date: '2026-08-22', time: '', notes: '' });
    }, 1500);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Appointments</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Loading appointments...' : `${sorted.length} appointments · ${activeBranch === 'All' ? 'All branches' : activeBranch}`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-[#f0f4f8] rounded-lg p-0.5">
            {(['queue', 'calendar'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${view === v ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {v === 'queue' ? 'Daily Queue' : 'Calendar'}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowBook(true)} icon={<PlusIcon />} size="sm">Book Appointment</Button>
        </div>
      </div>

      <div className="mb-5">
        <DepartmentGuide department="appointments" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
        />
        <select
          value={filterDoctor}
          onChange={(e) => setFilterDoctor(e.target.value)}
          className="px-3 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
        >
          <option value="">All Providers</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {view === 'queue' ? (
        <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f4f8]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {loading ? (
                <tr><td colSpan={6} className="text-center text-slate-400 py-12 text-sm">Loading daily queue...</td></tr>
              ) : (
                sorted.map((a) => (
                  <tr key={a.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm text-[#1b4fce] font-semibold">{a.time}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#0f172a]">{a.patientName}</p>
                      <p className="text-xs text-slate-400">{a.patientId}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-[#0f172a]">{a.doctorName}</p>
                      <p className="text-xs text-slate-400">{a.department}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-slate-500 max-w-[200px] truncate">{a.notes}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge(a.status)}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'Scheduled' && (
                        <button onClick={() => advanceStatus(a.id, 'Checked-in')} className="text-xs text-[#0d9488] font-medium hover:underline">Check In</button>
                      )}
                      {a.status === 'Checked-in' && (
                        <button onClick={() => advanceStatus(a.id, 'In Progress')} className="text-xs text-[#1b4fce] font-medium hover:underline">Start Visit</button>
                      )}
                      {a.status === 'In Progress' && (
                        <button onClick={() => advanceStatus(a.id, 'Completed')} className="text-xs text-green-600 font-medium hover:underline">Complete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-12 text-sm">No appointments for this date</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <CalendarView appointments={appointments} activeBranch={activeBranch} />
      )}

      {/* Book modal */}
      <Modal open={showBook} onClose={() => setShowBook(false)} title="Book Appointment">
        <form onSubmit={handleBook} className="p-6 space-y-4">
          {booked && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              ✓ Appointment booked successfully!
            </div>
          )}
          <Input label="Patient Name *" placeholder="Search patient..." required value={bookForm.patient} onChange={setBook('patient')} />
          <Select label="Provider *" required value={bookForm.doctor} onChange={setBook('doctor')}>
            <option value="">Select provider</option>
            {availableProviders.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || (d as any).fullName} {d.department ? `— ${d.department}` : ''} ({d.role})
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" required value={bookForm.date} onChange={setBook('date')} />
            <Input label="Time *" type="time" required value={bookForm.time} onChange={setBook('time')} />
          </div>
          <Textarea label="Notes" placeholder="Reason for visit..." rows={3} value={bookForm.notes} onChange={setBook('notes')} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={bookingLoading}>{bookingLoading ? 'Booking...' : 'Confirm Booking'}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowBook(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CalendarView({ appointments: appts, activeBranch }: { appointments: Appointment[]; activeBranch: string }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2026-08-19');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="grid grid-cols-7 gap-3">
      {days.map((day) => {
        const dayAppts = appts.filter((a) => a.date === day && (activeBranch === 'All' || a.branch === activeBranch));
        const dateObj = new Date(day + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = dateObj.getDate();

        return (
          <div key={day} className="bg-white rounded-xl border border-[#dbe4ef] p-3 min-h-[300px] flex flex-col">
            <div className="text-center pb-2 mb-2 border-b border-[#f0f4f8]">
              <p className="text-xs font-semibold text-slate-400 uppercase">{dayName}</p>
              <p className="text-base font-bold text-[#0f172a]">{dayNum}</p>
            </div>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {dayAppts.map((a) => (
                <div key={a.id} className="p-2 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#1b4fce] font-bold">{a.time}</span>
                    <Badge variant={statusBadge(a.status)} className="text-[9px] px-1 py-0">{a.status}</Badge>
                  </div>
                  <p className="font-semibold text-[#0f172a] mt-1 truncate">{a.patientName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{a.doctorName}</p>
                </div>
              ))}
              {dayAppts.length === 0 && <p className="text-[11px] text-slate-300 text-center mt-4">No appts</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
