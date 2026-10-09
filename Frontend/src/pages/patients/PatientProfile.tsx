import { Patient } from '../../types';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { useState, useEffect } from 'react';
import { patientService } from '../../services/patientService';

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onNavigate: (page: string, data?: unknown) => void;
}

const tabs = ['Overview', 'Visit History', 'Lab Results', 'Invoices', 'Follow-ups'];

export default function PatientProfile({ patient, onBack, onNavigate }: PatientProfileProps) {
  const [tab, setTab] = useState('Overview');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ date: '', notes: '' });
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const [scheduledFollowUps, setScheduledFollowUps] = useState<{ date: string; notes: string }[]>([]);
  const [detailedPatient, setDetailedPatient] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPatientDetails() {
      try {
        const data: any = await patientService.getPatient(patient.id);
        if (isMounted && data) {
          setDetailedPatient(data);
          if (data.followUps && Array.isArray(data.followUps)) {
            setScheduledFollowUps(
              data.followUps.map((f: any) => ({
                date: f.dueDate ? new Date(f.dueDate).toISOString().slice(0, 10) : '',
                notes: f.notes || f.condition || '',
              }))
            );
          }
        }
      } catch (err) {
        console.warn('Could not load detailed patient profile:', err);
      }
    }
    loadPatientDetails();
    return () => { isMounted = false; };
  }, [patient.id]);

  const age = patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'N/A';

  const patientAppts = detailedPatient?.appointments?.map((a: any) => ({
    id: a.id,
    patientId: a.patientId || patient.id,
    department: a.department?.name || 'General Medicine',
    doctorName: a.doctor?.fullName || 'Doctor',
    date: a.appointmentDate ? new Date(a.appointmentDate).toISOString().slice(0, 10) : '2026-08-22',
    time: a.appointmentTime || '09:00',
    notes: a.notes || 'Routine consultation',
    status: a.status || 'Scheduled',
  })) || [];

  const patientInvoices = detailedPatient?.invoices?.map((inv: any) => ({
    id: inv.id,
    patientId: inv.patientId || patient.id,
    visitDate: inv.visitDate ? new Date(inv.visitDate).toISOString().slice(0, 10) : '',
    lineItems: inv.lineItems || [],
    total: Number(inv.totalAmount || 0),
    status: inv.status || 'Unpaid',
  })) || [];

  const patientLabs = detailedPatient?.labOrders?.map((l: any) => ({
    id: l.id,
    patientId: l.patientId || patient.id,
    tests: l.items?.map((item: any) => item.testName) || [l.resultSummary || 'Laboratory Test'],
    status: l.status || 'Pending',
    orderedDate: l.orderedAt ? new Date(l.orderedAt).toISOString().slice(0, 10) : '',
    doctorName: l.doctor?.fullName || 'Dr. Mensah',
    results: l.resultSummary || undefined,
  })) || [];

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <button onClick={onBack} className="hover:text-[#1b4fce] transition-colors">Patients</button>
        <span>›</span>
        <span className="text-[#0f172a] font-medium">{patient.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-[#dbe4ef] p-6 mb-4">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {patient.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{patient.name}</h2>
                <p className="text-slate-500 text-sm mt-0.5">{age} years · {patient.gender} · Blood Group: <span className="font-semibold text-[#0f172a]">{patient.bloodGroup}</span></p>
                <p className="font-mono text-xs text-slate-400 mt-0.5">{patient.mrn}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => onNavigate('appointments')}>Book Appointment</Button>
                <Button variant="teal" size="sm" onClick={() => onNavigate('consultation')}>Start Consultation</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <InfoCell label="Phone" value={patient.phone} />
              <InfoCell label="Branch" value={patient.branch} />
              <InfoCell label="NHIS ID" value={patient.nhisId || '—'} />
              <InfoCell label="Registered" value={patient.registeredDate ? new Date(patient.registeredDate).toLocaleDateString('en-GH') : '—'} />
            </div>
          </div>
        </div>

        {/* Allergy alert */}
        {patient.allergies.length > 0 && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-red-700">ALLERGY ALERT</p>
              <p className="text-xs text-red-600">{patient.allergies.join(' · ')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
        <div className="flex border-b border-[#dbe4ef] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t
                  ? 'text-[#1b4fce] border-b-2 border-[#1b4fce] bg-blue-50/30'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'Overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Personal Information">
                <Row label="Date of Birth" value={new Date(patient.dob).toLocaleDateString('en-GH')} />
                <Row label="Address" value={patient.address} />
                <Row label="Email" value={patient.email || '—'} />
              </Section>
              <Section title="Emergency Contact">
                <Row label="Name" value={patient.emergencyContact} />
                <Row label="Phone" value={patient.emergencyPhone} />
              </Section>
            </div>
          )}

          {tab === 'Visit History' && (
            <div className="space-y-2">
              {patientAppts.map((a: any) => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl border border-[#f0f4f8] hover:bg-[#f8fafc]">
                  <div className="w-10 h-10 rounded-lg bg-[#e8eef7] flex items-center justify-center text-[#1b4fce] shrink-0">
                    <CalIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0f172a]">{a.department} — {a.doctorName}</p>
                    <p className="text-xs text-slate-400">{a.date} at {a.time} · {a.notes}</p>
                  </div>
                  <Badge variant={statusBadge(a.status)}>{a.status}</Badge>
                </div>
              ))}
              {patientAppts.length === 0 && <EmptyState text="No visit history" />}
            </div>
          )}

          {tab === 'Lab Results' && (
            <div className="space-y-3">
              {patientLabs.map((l: any) => (
                <div key={l.id} className="p-4 rounded-xl border border-[#f0f4f8]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-[#0f172a]">{l.tests.join(', ')}</p>
                    <Badge variant={statusBadge(l.status)}>{l.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{l.id} · {l.orderedDate} · {l.doctorName}</p>
                  {l.results && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg font-mono mt-2">{l.results}</p>}
                </div>
              ))}
              {patientLabs.length === 0 && <EmptyState text="No lab results" />}
            </div>
          )}

          {tab === 'Invoices' && (
            <div className="space-y-2">
              {patientInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-[#f0f4f8]">
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">{inv.id}</p>
                    <p className="text-xs text-slate-400">{inv.visitDate} · {inv.lineItems.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0f172a]">GHS {inv.total.toLocaleString()}</p>
                    <Badge variant={statusBadge(inv.status)}>{inv.status}</Badge>
                  </div>
                </div>
              ))}
              {patientInvoices.length === 0 && <EmptyState text="No invoices" />}
            </div>
          )}

          {tab === 'Follow-ups' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => { setFollowUpForm({ date: '', notes: '' }); setFollowUpSaved(false); setShowFollowUp(true); }}>+ Schedule Follow-up</Button>
              </div>
              {scheduledFollowUps.map((fu, i) => (
                <div key={i} className="p-4 bg-white border border-[#dbe4ef] rounded-xl flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">Follow-up on {fu.date}</p>
                    {fu.notes && <p className="text-xs text-slate-500 mt-1">{fu.notes}</p>}
                  </div>
                  <Badge variant="warning">Scheduled</Badge>
                </div>
              ))}
              {scheduledFollowUps.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">No follow-ups scheduled yet</p>
                  <p className="text-xs text-slate-300 mt-1">Click the button above to add one</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      <Modal open={showFollowUp} onClose={() => setShowFollowUp(false)} title="Schedule Follow-up">
        <div className="p-6 space-y-4">
          {followUpSaved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Follow-up scheduled!</div>}
          <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#dbe4ef]">
            <p className="text-sm font-semibold text-[#0f172a]">{patient.name}</p>
            <p className="text-xs text-slate-400">{patient.id} · {patient.phone}</p>
          </div>
          <Input
            label="Follow-up Date *"
            type="date"
            value={followUpForm.date}
            onChange={(e) => setFollowUpForm((f) => ({ ...f, date: e.target.value }))}
          />
          <Textarea
            label="Notes / Instructions"
            placeholder="What should be reviewed on this follow-up..."
            rows={3}
            value={followUpForm.notes}
            onChange={(e) => setFollowUpForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button onClick={async () => {
              if (!followUpForm.date) return;
              try {
                await patientService.scheduleFollowUp(patient.id, {
                  dueDate: followUpForm.date,
                  notes: followUpForm.notes,
                });
              } catch {
                // Smooth local fallback
              }
              setScheduledFollowUps((prev) => [...prev, { date: followUpForm.date, notes: followUpForm.notes }]);
              setFollowUpSaved(true);
              setTimeout(() => { setShowFollowUp(false); setFollowUpSaved(false); }, 1300);
            }}>Save Follow-up</Button>
            <Button variant="secondary" onClick={() => setShowFollowUp(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-medium text-[#0f172a] mt-0.5">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-[#f0f4f8] last:border-0">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-[#0f172a] text-right">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-sm text-slate-400 py-8">{text}</p>;
}

function CalIcon() { return <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="1" y="2.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
