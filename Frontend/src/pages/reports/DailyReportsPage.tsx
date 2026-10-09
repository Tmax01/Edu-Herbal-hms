import { useState, useRef } from 'react';
import { Role } from '../../types';
import { DailyReport } from '../../types/communication';
import { useAuth } from '../../contexts/AuthContext';
import { useDailyReports } from '../../hooks/useDailyReports';

import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';

const statusColor: Record<DailyReport['status'], 'success' | 'info' | 'warning'> = {
  Approved: 'success', Reviewed: 'success', Noted: 'info', Submitted: 'warning',
};


// ── Department-specific task checklists ──────────────────────────────────────
const departmentChecklist: Record<string, { category: string; tasks: string[] }[]> = {
  doctor: [
    { category: 'Patient Care', tasks: ['Conducted morning ward rounds', 'Saw and consulted outpatients', 'Attended to emergency cases', 'Conducted telemedicine sessions'] },
    { category: 'Documentation & Orders', tasks: ['Approved lab results', 'Created/updated prescriptions', 'Ordered diagnostic investigations', 'Completed discharge summaries', 'Updated patient clinical notes'] },
    { category: 'Collaboration', tasks: ['Attended departmental briefing', 'Consulted with specialist colleagues', 'Briefed nursing staff on patient management plans', 'Reviewed referred cases'] },
  ],
  nurse: [
    { category: 'Vitals & Monitoring', tasks: ['Completed morning vital signs for all patients', 'Completed afternoon vital signs check', 'Documented all vitals in HMS', 'Escalated abnormal vital signs to doctor'] },
    { category: 'Medication Administration', tasks: ['Administered morning medications (06:00 round)', 'Administered midday medications (12:00 round)', 'Administered evening medications (18:00 round)', 'Documented all medication administration', 'Verified medication against prescription before administration'] },
    { category: 'Patient Care', tasks: ['Performed wound dressing changes', 'Assisted with patient hygiene and comfort', 'Monitored IV lines and fluid intake/output', 'Received new admissions and completed admission notes', 'Conducted patient handover to incoming shift'] },
    { category: 'Documentation', tasks: ['Updated nursing notes in HMS', 'Completed patient handover report', 'Reported critical findings to attending doctor', 'Documented incident reports (if any)'] },
  ],
  pharmacist: [
    { category: 'Prescription Dispensing', tasks: ['Dispensed outpatient prescriptions', 'Processed inpatient ward medication orders', 'Verified prescription accuracy before dispensing', 'Counselled patients on medication use and side effects', 'Handled partial dispensing cases'] },
    { category: 'Inventory Management', tasks: ['Conducted morning stock count', 'Updated FEFO (First Expiry First Out) rack arrangement', 'Identified and flagged near-expiry items', 'Raised low-stock reorder alerts', 'Documented stock transfers from stores'] },
    { category: 'Quality & Compliance', tasks: ['Checked cold-chain drug storage temperatures', 'Updated controlled substance register', 'Verified batch numbers and expiry dates on new stock', 'Conducted medication reconciliation for new admissions'] },
  ],
  lab_tech: [
    { category: 'Sample Processing', tasks: ['Received, labelled and logged all specimen samples', 'Processed haematology orders (FBC, ESR, etc.)', 'Processed biochemistry orders (LFT, RFT, Lipids, etc.)', 'Processed serology/immunology tests', 'Processed microbiology cultures', 'Conducted malaria RDT testing'] },
    { category: 'Equipment & QC', tasks: ['Calibrated haematology analyser at start of shift', 'Checked and recorded reagent stock levels', 'Performed internal quality control runs', 'Maintained and documented QC records for all analysers', 'Performed preventive maintenance on laboratory instruments'] },
    { category: 'Reporting', tasks: ['Submitted completed results for doctor approval', 'Immediately flagged and reported critical values', 'Updated pending results log', 'Uploaded PDF lab reports to HMS where applicable', 'Communicated urgent results directly to requesting clinician'] },
  ],
  receptionist: [
    { category: 'Patient Registration', tasks: ['Registered new patients and created records', 'Updated existing patient demographic records', 'Verified NHIS cards for eligible patients', 'Scanned and attached patient documents to HMS'] },
    { category: 'Appointments', tasks: ['Managed appointment scheduling and rescheduling', 'Confirmed and reminded patients of next-day appointments', 'Handled walk-in patient triage and queue management', 'Updated appointment status in HMS after each visit'] },
    { category: 'Billing & Collections', tasks: ['Collected patient consultation fees', 'Processed NHIS claims submissions', 'Issued receipts for all transactions', 'Reconciled daily cash and mobile money collections', 'Prepared end-of-day collection summary'] },
    { category: 'Communication', tasks: ['Answered and managed all incoming calls', 'Handled patient inquiries, complaints and referrals', 'Communicated with clinical departments on patient flow', 'Welcomed and directed patients/visitors'] },
  ],
  accountant: [
    { category: 'Revenue & Collections', tasks: ['Reviewed daily collection report from reception', 'Reconciled all payment method records (Cash, MoMo, POS, Bank)', 'Followed up on outstanding/unpaid invoices', 'Verified NHIS claims submitted for processing'] },
    { category: 'Expenses & Payments', tasks: ['Processed and documented expense claims', 'Updated general expense ledger', 'Verified supplier invoices against purchase orders', 'Processed approved vendor payments'] },
    { category: 'Payroll & HR Finance', tasks: ['Updated staff attendance and timesheet records', 'Processed approved salary payments', 'Documented overtime and allowance claims', 'Maintained statutory deductions records (SSNIT, Tax)'] },
    { category: 'Financial Reporting', tasks: ['Prepared daily revenue and expenditure summary', 'Updated monthly income and expense accounts', 'Reviewed budget vs actual variance', 'Submitted financial report to management'] },
  ],
  store_officer: [
    { category: 'Receiving & Verification', tasks: ['Received and verified supplier deliveries against LPO', 'Updated stock ledger for all new items received', 'Checked delivery quantities and product condition', 'Issued goods received notes (GRN) to suppliers'] },
    { category: 'Inventory Control', tasks: ['Conducted stock count for critical/low-level items', 'Identified and raised reorder alerts for low stock', 'Checked expiry dates and segregated expired stock', 'Updated bin cards and stock control cards', 'Arranged stock according to FEFO principles'] },
    { category: 'Issue & Dispatch', tasks: ['Issued stock items to requesting departments', 'Documented all stock movements in issue register', 'Prepared and signed inter-branch transfer notes', 'Updated HMS inventory records after all issues'] },
  ],
  call_centre: [
    { category: 'Inbound Calls', tasks: ['Handled patient appointment booking inquiries', 'Resolved patient service complaints and escalations', 'Provided accurate hospital information to callers', 'Redirected calls to appropriate departments'] },
    { category: 'Outbound & Follow-up', tasks: ['Made next-day appointment reminder calls', 'Conducted follow-up calls for pending patient cases', 'Called patients on doctor-ordered follow-up list', 'Sent appointment and wellness SMS reminders'] },
    { category: 'Documentation', tasks: ['Logged all call records in HMS Call Centre module', 'Updated follow-up schedules and outcomes', 'Escalated unresolved issues to supervisor in writing', 'Submitted call volume and outcome report'] },
  ],
  admin: [
    { category: 'Operations & Oversight', tasks: ['Reviewed daily department activity reports', 'Addressed staff queries, grievances and issues', 'Approved/rejected leave and off-duty requests', 'Monitored overall hospital operations'] },
    { category: 'Coordination', tasks: ['Coordinated with all department heads', 'Attended management and operations briefings', 'Supervised facilities and maintenance activities', 'Managed vendor and external stakeholder communications'] },
    { category: 'Records & Compliance', tasks: ['Updated staff HR records and personnel files', 'Reviewed and filed incident and occurrence reports', 'Verified regulatory and compliance documentation', 'Archived patient and administrative records'] },
  ],
  cto: [
    { category: 'System & Technology', tasks: ['Reviewed HMS system performance and uptime metrics', 'Addressed and resolved IT support tickets', 'Monitored data backup and recovery status', 'Updated system configurations and access permissions'] },
    { category: 'Security & Compliance', tasks: ['Reviewed daily audit logs for unusual access patterns', 'Managed user accounts, roles and module access', 'Checked firewall and security alert status', 'Ensured data protection compliance (Ghana DPA)'] },
    { category: 'Development & Training', tasks: ['Reviewed technology roadmap and update schedule', 'Tested and validated new system features', 'Provided staff IT training or support', 'Documented system changes and update notes'] },
  ],
};

function getChecklist(role: Role): { category: string; tasks: string[] }[] {
  return departmentChecklist[role] ?? departmentChecklist['admin'];
}

interface ChecklistState {
  [task: string]: boolean;
}

export default function DailyReportsPage() {
  const { user, activeBranch, isAdmin } = useAuth();
  const [view, setView] = useState<'my' | 'all'>('my');
  const { reports, loading, submitReport, reviewReport: doReview } = useDailyReports(activeBranch, view === 'my');
  const [filterDate, setFilterDate] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [showSubmit, setShowSubmit] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selected, setSelected] = useState<DailyReport | null>(null);
  const [submitSaved, setSubmitSaved] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [patientsHandled, setPatientsHandled] = useState('0');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [checks, setChecks] = useState<ChecklistState>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const myReports = reports.filter((r) => r.staffId === user?.id);
  const allReports = reports.filter((r) => {
    const branchOk = activeBranch === 'All' || !r.branch || r.branch === activeBranch;
    const dateOk = !filterDate || r.date === filterDate;
    const deptOk = filterDept === 'All' || r.department === filterDept;
    return branchOk && dateOk && deptOk;
  });

  const displayed = view === 'my' ? myReports : allReports;
  const departments = ['All', ...Array.from(new Set(reports.map((r) => r.department)))];
  const todaySubmitted = myReports.some((r) => r.date === new Date().toISOString().split('T')[0]);

  const checklist = user ? getChecklist(user.role) : [];
  const checkedCount = Object.values(checks).filter(Boolean).length;
  const totalTasks = checklist.reduce((acc, cat) => acc + cat.tasks.length, 0);

  const openSubmit = () => {
    setChecks({});
    setNotes('');
    setPatientsHandled('0');
    setReportDate(new Date().toISOString().split('T')[0]);
    setAttachedFile(null);
    setShowSubmit(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const checkedTasks = Object.entries(checks)
      .filter(([, v]) => v)
      .map(([k]) => `• ${k}`)
      .join('\n');
    const activities = checkedTasks || 'No tasks selected';
    await submitReport(
      {
        department: user.department,
        summary: notes || 'Daily Department Report',
        keyActivities: activities,
        reportDate,
      },
      user.id,
      user.name,
      user.department,
      activeBranch
    );
    setSubmitSaved(true);
    setTimeout(() => { setShowSubmit(false); setSubmitSaved(false); setChecks({}); setNotes(''); setAttachedFile(null); }, 1500);
  };

  const handleReview = async (status: 'Reviewed' | 'Approved' | 'Noted') => {
    if (!selected) return;
    await doReview(selected.id, status, reviewNotes, user?.name);
    setReviewSaved(true);
    setTimeout(() => { setShowReview(false); setSelected(null); setReviewSaved(false); setReviewNotes(''); }, 1400);
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Daily Activity Reports</h2>
          <p className="text-sm text-slate-400">Department activity logs · reviewed by Admin &amp; CTO</p>
        </div>
        <div className="flex gap-2 items-center">
          {todaySubmitted ? (
            <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">✓ Today submitted</span>
          ) : (
            <Button onClick={openSubmit} icon={<PlusIcon />} size="sm">Submit Today&apos;s Report</Button>
          )}
        </div>
      </div>

      {/* View toggle */}
      {isAdmin() && (
        <div className="flex gap-1 bg-[#f0f4f8] rounded-xl p-1 mb-5 w-fit">
          {(['my', 'all'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === v ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}>
              {v === 'my' ? 'My Reports' : 'All Staff Reports'}
            </button>
          ))}
        </div>
      )}

      {/* Admin filters */}
      {view === 'all' && (
        <div className="flex gap-3 mb-4 flex-wrap items-end">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Date</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="text-sm border border-[#dbe4ef] rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]/20" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Department</label>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="text-sm border border-[#dbe4ef] rounded-lg px-3 py-1.5 bg-white focus:outline-none">
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          {(filterDate || filterDept !== 'All') && (
            <button onClick={() => { setFilterDate(''); setFilterDept('All'); }} className="text-xs text-slate-400 hover:text-red-500 mb-0.5">Clear</button>
          )}
        </div>
      )}

      {/* Summary stats (admin view) */}
      {view === 'all' && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Pending Review', count: allReports.filter((r) => r.status === 'Submitted').length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Reviewed', count: allReports.filter((r) => r.status === 'Reviewed').length, color: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Noted', count: allReports.filter((r) => r.status === 'Noted').length, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{s.count}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reports list */}
      <div className="space-y-3">
        {displayed.map((r) => {
          const acts = r.activities || r.keyActivities || r.summary || '';
          const taskLines = acts.split('\n').filter((l) => l.startsWith('•'));
          return (
            <div key={r.id} className="bg-white rounded-xl border border-[#dbe4ef] p-5">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {r.staffName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a] text-sm">{r.staffName}</p>
                    <p className="text-xs text-slate-400">{r.department} · {r.branch} · {r.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusColor[r.status]}>{r.status}</Badge>
                  {isAdmin() && r.status === 'Submitted' && (
                    <Button size="sm" variant="ghost" onClick={() => { setSelected(r); setShowReview(true); }}>Review</Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {taskLines.length > 0 ? (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Completed Tasks ({taskLines.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {taskLines.map((line, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="text-green-500 shrink-0">✓</span>
                          <span>{line.replace('• ', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed">{acts}</p>
                )}
                {(r.patientsHandled || 0) > 0 && (
                  <p className="text-xs text-slate-500">Patients handled: <strong className="text-[#1b4fce]">{r.patientsHandled}</strong></p>
                )}

                {r.recommendations && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 mt-2">Notes &amp; Recommendations</p>
                    <p className="text-sm text-slate-500">{r.recommendations}</p>
                  </div>
                )}
                {r.reviewNotes && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">Manager Review — {r.reviewedBy}</p>
                    <p className="text-sm text-green-800">{r.reviewNotes}</p>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-[#f0f4f8] flex justify-between">
                <span className="text-[10px] text-slate-300 font-mono">{r.id}</span>
                <span className="text-[10px] text-slate-300">Submitted {r.submittedAt}</span>
              </div>
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">{view === 'my' ? 'No reports submitted yet' : 'No reports match these filters'}</p>
          </div>
        )}
      </div>

      {/* ── Submit Modal — FAQ Checklist ── */}
      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Daily Activity Report" width="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {submitSaved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Report submitted successfully!</div>}

            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="p-3 bg-[#f0f4f8] rounded-xl flex-1">
                <p className="text-xs text-slate-400">Submitting as <strong className="text-[#0f172a]">{user?.name}</strong> · {user?.department}</p>
              </div>
              <div className="ml-3">
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="text-sm border border-[#dbe4ef] rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]/20" />
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-slate-500">Tasks Completed</p>
                <span className="text-xs font-bold text-[#1b4fce]">{checkedCount} / {totalTasks}</span>
              </div>
              <div className="h-2 bg-[#f0f4f8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1b4fce] to-[#0d9488] rounded-full transition-all"
                  style={{ width: `${totalTasks > 0 ? (checkedCount / totalTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Checklist by category */}
            {checklist.map((cat) => (
              <div key={cat.category}>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">{cat.category}</p>
                <div className="space-y-1.5">
                  {cat.tasks.map((task) => (
                    <label key={task} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checks[task] ? 'bg-blue-50 border-blue-200' : 'bg-[#f8fafc] border-[#f0f4f8] hover:border-[#dbe4ef]'
                    }`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all ${
                        checks[task] ? 'bg-[#1b4fce] border-[#1b4fce]' : 'border-slate-300 bg-white'
                      }`}>
                        {checks[task] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!!checks[task]}
                        onChange={(e) => setChecks((p) => ({ ...p, [task]: e.target.checked }))}
                      />
                      <span className={`text-sm leading-snug ${checks[task] ? 'text-[#1b4fce] font-medium' : 'text-slate-600'}`}>{task}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {/* Patients handled */}
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Number of Patients Handled</label>
              <input
                type="number"
                min="0"
                value={patientsHandled}
                onChange={(e) => setPatientsHandled(e.target.value)}
                className="w-24 border border-[#dbe4ef] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b4fce]/20"
              />
            </div>

            {/* Notes */}
            <Textarea
              label="Additional Notes / Observations / Recommendations"
              placeholder="Any extra notes, challenges encountered, recommendations, or anything management should know about today's work..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {/* File attachment */}
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Attach Supporting Document (optional)</label>
              <div
                className={`border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors ${
                  attachedFile ? 'border-green-400 bg-green-50' : 'border-[#dbe4ef] hover:border-[#1b4fce]/40'
                }`}
                onClick={() => fileRef.current?.click()}
              >
                {attachedFile ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📎</span>
                    <div>
                      <p className="text-sm font-medium text-green-700">{attachedFile.name}</p>
                      <p className="text-xs text-green-500">{(attachedFile.size / 1024).toFixed(0)} KB · Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-2xl">📎</span>
                    <p className="text-sm text-slate-500 mt-1">Attach report or supporting file</p>
                    <p className="text-xs text-slate-400">PDF, image, Word, or Excel</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx" onChange={(e) => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); }} />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#f0f4f8] flex items-center justify-between">
            <p className="text-xs text-slate-400">{checkedCount} tasks checked</p>
            <div className="flex gap-2">
              <Button type="submit" disabled={checkedCount === 0}>Submit Report</Button>
              <Button type="button" variant="secondary" onClick={() => setShowSubmit(false)}>Cancel</Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal open={showReview} onClose={() => { setShowReview(false); setSelected(null); }} title={`Review — ${selected?.staffName}`} width="max-w-xl">
        {selected && (
          <div className="p-6 space-y-4">
            {reviewSaved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Review saved!</div>}
            <div className="bg-[#f8fafc] rounded-xl p-4 space-y-2 text-sm text-slate-600 max-h-52 overflow-y-auto">
              <p><strong className="text-[#0f172a]">{selected.department}</strong> · {selected.branch} · {selected.date}</p>
              <div className="mt-2 space-y-0.5">
                {(selected.activities || selected.keyActivities || selected.summary || '').split('\n').filter(Boolean).map((line, i) => (
                  <p key={i} className="text-xs">{line}</p>
                ))}

              </div>
              {selected.recommendations && <p className="mt-2 text-xs"><strong>Notes:</strong> {selected.recommendations}</p>}
            </div>
            <Textarea
              label="Manager Review Notes"
              placeholder="Acknowledgement, feedback, or action items..."
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => handleReview('Reviewed')}>Mark Reviewed</Button>
              <Button variant="teal" onClick={() => handleReview('Noted')}>Mark Noted</Button>
              <Button variant="secondary" onClick={() => { setShowReview(false); setSelected(null); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
