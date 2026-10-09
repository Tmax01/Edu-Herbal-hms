import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState } from 'react';
import { PatientFollowUp } from '../../types/callcentre';
import { useAuth } from '../../contexts/AuthContext';
import { useCallCentre } from '../../hooks/useCallCentre';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';

const statusVariant = (s: string) => {
  if (s === 'Due') return 'warning';
  if (s === 'Overdue') return 'danger';
  if (s === 'Completed') return 'success';
  return 'muted';
};

export default function FollowUpsPage() {
  const { activeBranch } = useAuth();
  const { followUps: all, loading, markFollowUpCompleted } = useCallCentre(activeBranch);
  const [selected, setSelected] = useState<PatientFollowUp | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ notes: '', effectiveness: 'Good', nextDate: '' });
  const [saved, setSaved] = useState(false);

  const filtered = all.filter((f) => activeBranch === 'All' || !f.branch || f.branch === activeBranch);
  const overdue = filtered.filter((f) => f.status === 'Overdue');
  const due = filtered.filter((f) => f.status === 'Due');
  const completed = filtered.filter((f) => f.status === 'Completed');

  const setR = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setReviewForm((p) => ({ ...p, [field]: e.target.value }));

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    await markFollowUpCompleted(selected.id, reviewForm.notes);
    setSaved(true);
    setTimeout(() => { setShowReview(false); setSaved(false); setSelected(null); setReviewForm({ notes: '', effectiveness: 'Good', nextDate: '' }); }, 1300);
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Patient Follow-ups & Reviews</h2>
          <p className="text-sm text-slate-400">{overdue.length} overdue · {due.length} due · {completed.length} completed</p>
        </div>
      </div>

      <div className="mb-5"><DepartmentGuide department="followups" /></div>

      {/* Urgent notice */}
      {overdue.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-800">{overdue.length} overdue follow-up{overdue.length > 1 ? 's' : ''} require immediate attention</p>
            <p className="text-xs text-red-600 mt-0.5">{overdue.map((f) => f.patientName).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending (due + overdue) */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Pending Reviews</h3>
          <div className="space-y-3">
            {[...overdue, ...due].map((f) => (
              <div key={f.id} className={`bg-white rounded-xl border p-4 ${f.status === 'Overdue' ? 'border-red-300' : 'border-[#dbe4ef]'}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#0f172a] text-sm">{f.patientName}</p>
                      <Badge variant={statusVariant(f.status)}>{f.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{f.condition}</p>
                    <p className="text-xs text-slate-400">Dr: {f.doctorName} · Last visit: {f.lastVisit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${f.status === 'Overdue' ? 'text-red-600' : 'text-amber-600'}`}>Due: {f.dueDate}</p>
                    <p className="text-[10px] text-slate-400">{f.branch}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-2 border-t border-[#f0f4f8]">
                  <Button size="sm" onClick={() => { setSelected(f); setShowReview(true); setSaved(false); }}>Record Review</Button>
                  <Button size="sm" variant="secondary">Call Patient</Button>
                </div>
              </div>
            ))}
            {[...overdue, ...due].length === 0 && (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-slate-400">All follow-ups are up to date</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Completed Reviews</h3>
          <div className="space-y-3">
            {completed.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-green-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#0f172a] text-sm">{f.patientName}</p>
                      <Badge variant="success">Completed</Badge>
                      {f.effectiveness && (
                        <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded font-medium">{f.effectiveness}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{f.condition}</p>
                    {f.notes && <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg leading-relaxed">{f.notes}</p>}
                    {f.nextDate && <p className="text-xs text-[#1b4fce] font-medium mt-1.5">Next review: {f.nextDate}</p>}
                  </div>
                </div>
              </div>
            ))}
            {completed.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No completed reviews yet</p>}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal open={showReview} onClose={() => { setShowReview(false); setSelected(null); }} title="Record Follow-up Review">
        <form onSubmit={handleReview} className="p-6 space-y-4">
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Follow-up review recorded!</div>}
          {selected && (
            <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#dbe4ef]">
              <p className="text-sm font-semibold text-[#0f172a]">{selected.patientName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selected.condition} · {selected.doctorName}</p>
            </div>
          )}
          <Textarea label="Review Notes *" placeholder="Patient progress, symptoms, treatment effectiveness, side effects..." rows={4} required value={reviewForm.notes} onChange={setR('notes')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Treatment Effectiveness" value={reviewForm.effectiveness ?? 'Good'} onChange={setR('effectiveness')}>
              <option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option>
            </Select>
            <Input label="Next Review Date" type="date" value={reviewForm.nextDate} onChange={setR('nextDate')} />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save Review</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowReview(false); setSelected(null); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
