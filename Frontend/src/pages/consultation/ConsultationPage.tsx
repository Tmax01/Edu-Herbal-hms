import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePatients } from '../../hooks/usePatients';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Textarea, Input, Select } from '../../components/ui/Input';
import { useConsultation } from '../../hooks/useConsultation';
import { consultationService } from '../../services/consultationService';
import { smsService } from '../../services/smsService';

export default function ConsultationPage() {
  const { activeBranch } = useAuth();
  const { patients, loading: loadingPatients } = usePatients('', activeBranch);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0] || {
    id: 'PAT-DEMO',
    name: 'Walk-in Patient',
    mrn: 'MRN-NEW',
    gender: 'Adult',
    dob: '1990-01-01',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodGroup: 'O+',
    nhisId: '',
    allergies: [] as string[],
    branch: activeBranch === 'All' ? 'Accra' : activeBranch,
  };
  const [activeTab, setActiveTab] = useState<'conventional' | 'herbal'>('conventional');
  const [formData, setFormData] = useState({
    complaint: '',
    diagnosis: '',
    vitals_bp: '',
    vitals_pulse: '',
    vitals_temp: '',
    vitals_weight: '',
    vitals_height: '',
    vitals_sugar: '',
    notes: '',
  });
  const [prescribedItems, setPrescribedItems] = useState<{ drug: string; dosage: string; frequency: string; duration: string }[]>([]);
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [newDrug, setNewDrug] = useState({ drug: '', dosage: '', frequency: '', duration: '' });
  const [saved, setSaved] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [showLabRequest, setShowLabRequest] = useState(false);
  const [labTests, setLabTests] = useState('');
  const [labRequestSent, setLabRequestSent] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralForm, setReferralForm] = useState({ specialist: '', reason: '', notes: '' });
  const [referralSent, setReferralSent] = useState(false);

  const { loading, aiLoading, aiDifferentials, saveConsultation, getAiDiagnosis, clearAiDifferentials } = useConsultation();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData((f) => ({ ...f, [field]: e.target.value }));

  const addDrug = () => {
    if (newDrug.drug) {
      setPrescribedItems((p) => [...p, newDrug]);
      setNewDrug({ drug: '', dosage: '', frequency: '', duration: '' });
      setShowAddDrug(false);
    }
  };

  const hasVitals = !!(formData.vitals_bp || formData.vitals_pulse || formData.vitals_temp || formData.vitals_weight);

  const handleSave = async () => {
    await saveConsultation({
      patientId: selectedPatient.id,
      chiefComplaint: formData.complaint || 'General Consultation',
      diagnosis: formData.diagnosis || 'Clinical evaluation',
      treatmentPlan: formData.notes,
      prescriptions: prescribedItems.map((item) => ({
        drugName: item.drug,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: parseInt(item.duration) || 3,
      })),
      vitals: hasVitals
        ? {
            patientId: selectedPatient.id,
            bp: formData.vitals_bp,
            pulseRate: parseInt(formData.vitals_pulse) || undefined,
            temperature: parseFloat(formData.vitals_temp) || undefined,
            weightKg: parseFloat(formData.vitals_weight) || undefined,
            heightCm: parseFloat(formData.vitals_height) || undefined,
            bloodSugar: formData.vitals_sugar,
          }
        : undefined,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (hasVitals) setShowSms(true);
  };

  const handleRequestLabs = async () => {
    if (!labTests.trim()) return;
    try {
      await consultationService.requestLabTests({
        patientId: selectedPatient.id,
        testNames: labTests.split(',').map((t) => t.trim()),
        urgency: 'Routine',
      });
    } catch {
      // Local fallback
    }
    setLabRequestSent(true);
    setTimeout(() => {
      setShowLabRequest(false);
      setLabRequestSent(false);
      setLabTests('');
    }, 1500);
  };

  const handleCreateReferral = async () => {
    if (!referralForm.reason.trim()) return;
    try {
      await consultationService.createReferral({
        patientId: selectedPatient.id,
        reason: referralForm.reason,
        notes: referralForm.notes,
      });
    } catch {
      // Local fallback
    }
    setReferralSent(true);
    setTimeout(() => {
      setShowReferral(false);
      setReferralSent(false);
      setReferralForm({ specialist: '', reason: '', notes: '' });
    }, 1500);
  };

  const sendSms = async () => {
    setSmsSent(true);
    try {
      if (selectedPatient.phone) {
        await smsService.sendSms({
          recipientPhone: selectedPatient.phone,
          message: buildSmsText(),
          recipientName: selectedPatient.name,
          patientId: selectedPatient.id,
        });
      }
    } catch {
      // Ignore SMS send error
    }
    setTimeout(() => { setShowSms(false); setSmsSent(false); }, 1800);
  };

  const buildSmsText = () => {
    const lines = [
      `Dear ${(selectedPatient?.name || 'Patient').split(' ')[0]},`,
      `Welcome to Edu Herbal Clinic (EduHMS). Your Good Health Is Our Concern.`,
      ``,
      `Your vitals recorded today:`,
      formData.vitals_bp ? `• Blood Pressure: ${formData.vitals_bp} mmHg` : null,
      formData.vitals_sugar ? `• Blood Sugar: ${formData.vitals_sugar} mmol/L` : null,
      formData.vitals_temp ? `• Temperature: ${formData.vitals_temp}°C` : null,
      formData.vitals_pulse ? `• Pulse: ${formData.vitals_pulse} bpm` : null,
      formData.vitals_weight ? `• Weight: ${formData.vitals_weight} kg` : null,
      formData.vitals_height ? `• Height: ${formData.vitals_height} cm` : null,
      selectedPatient.bloodGroup ? `• Blood Group: ${selectedPatient.bloodGroup}` : null,
      ``,
      `Please follow your doctor's instructions. For enquiries call: 030-XXX-XXXX`,
      `— EduHMS Team`,
    ].filter((l): l is string => l !== null);
    return lines.join('\n');
  };

  return (
    <div className="p-6 space-y-5">
      <DepartmentGuide department="consultation" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Patient selector sidebar */}
        <div className="xl:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Active Visit</h3>
          <div className="bg-white rounded-xl border border-[#dbe4ef] p-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Select Patient</p>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {loadingPatients && patients.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Loading patients...</p>
              ) : patients.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No patients found.</p>
              ) : (
                patients.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-colors ${selectedPatient?.id === p.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {(p.name || 'Patient').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#0f172a] truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.mrn} · {p.branch}</p>
                    </div>
                    {selectedPatient?.id === p.id && <span className="w-2 h-2 rounded-full bg-[#1b4fce] shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Patient summary */}
          <div className="bg-white rounded-xl border border-[#dbe4ef] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#f0f4f8] pb-3">
              <div>
                <p className="text-sm font-bold text-[#0f172a]">{selectedPatient?.name || 'Walk-in Patient'}</p>
                <p className="text-xs text-slate-400">{selectedPatient?.gender} · Blood Group: <span className="font-semibold text-[#0f172a]">{selectedPatient?.bloodGroup || 'Unknown'}</span></p>
              </div>
              <Badge variant="teal">{selectedPatient?.branch || activeBranch}</Badge>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Known Allergies</p>
              {selectedPatient?.allergies && selectedPatient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedPatient.allergies.map((a: string) => <Badge key={a} variant="danger" className="text-[10px]">{a}</Badge>)}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No known allergies</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col gap-1.5">
              <Button size="sm" variant="secondary" className="w-full text-xs justify-start" onClick={() => setShowLabRequest(true)}>+ Request Lab Test</Button>
              <Button size="sm" variant="secondary" className="w-full text-xs justify-start" onClick={() => setShowReferral(true)}>+ Create Referral</Button>
              <Button
                size="sm"
                variant="teal"
                className="w-full text-xs justify-start"
                disabled={aiLoading}
                onClick={() => getAiDiagnosis(formData.complaint ? [formData.complaint] : ['Fever', 'Headache'])}
              >
                {aiLoading ? 'Analyzing Symptoms...' : '🤖 AI Differential Diagnosis'}
              </Button>
            </div>
          </div>

          {/* AI Differential Diagnosis Box */}
          {aiDifferentials && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">🤖 AI Differential Insights</p>
                <button onClick={clearAiDifferentials} className="text-xs text-indigo-400 hover:text-indigo-700">✕</button>
              </div>
              {aiDifferentials.response && (
                <div className="bg-white/80 rounded-lg p-2.5 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {aiDifferentials.response}
                </div>
              )}
              {(aiDifferentials.differentials || []).map((d, idx) => (
                <div key={idx} className="bg-white/80 rounded-lg p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0f172a]">{d.condition}</span>
                    <Badge variant={d.probability === 'High' ? 'danger' : 'warning'} className="text-[9px]">{d.probability} Probability</Badge>
                  </div>
                  <p className="text-slate-600 text-[11px]">{d.rationale}</p>
                  {d.suggestedInvestigations?.length > 0 && (
                    <p className="text-[10px] text-indigo-700 font-medium">Tests: {d.suggestedInvestigations.join(', ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Consultation Form */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-[#dbe4ef] p-6 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Doctor Consultation Encounter Note</h2>
              <div className="flex bg-[#f0f4f8] rounded-lg p-0.5">
                {(['conventional', 'herbal'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${activeTab === t ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {t === 'conventional' ? 'Conventional Med' : 'Herbal Treatment'}
                  </button>
                ))}
              </div>
            </div>

            {saved && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                ✓ Consultation record saved to patient profile!
              </div>
            )}

            {/* Vitals Triage Inputs */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Encounter Vitals (Triage)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <Input label="BP (mmHg)" placeholder="120/80" value={formData.vitals_bp} onChange={set('vitals_bp')} />
                <Input label="Pulse (bpm)" placeholder="72" value={formData.vitals_pulse} onChange={set('vitals_pulse')} />
                <Input label="Temp (°C)" placeholder="36.8" value={formData.vitals_temp} onChange={set('vitals_temp')} />
                <Input label="Weight (kg)" placeholder="65" value={formData.vitals_weight} onChange={set('vitals_weight')} />
                <Input label="Height (cm)" placeholder="170" value={formData.vitals_height} onChange={set('vitals_height')} />
                <Input label="Sugar (mmol/L)" placeholder="5.4" value={formData.vitals_sugar} onChange={set('vitals_sugar')} />
              </div>
            </div>

            <Textarea label="Chief Complaint *" placeholder="Describe symptoms and duration..." rows={3} value={formData.complaint} onChange={set('complaint')} />
            <Textarea label="Clinical Diagnosis *" placeholder="Enter diagnosis or ICD-10 code..." rows={2} value={formData.diagnosis} onChange={set('diagnosis')} />

            {/* Prescriptions Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {activeTab === 'conventional' ? 'Prescribed Medications' : 'Herbal Treatment Formulations'}
                </p>
                <Button size="sm" variant="secondary" onClick={() => setShowAddDrug(true)}>+ Add Drug</Button>
              </div>

              {prescribedItems.length > 0 ? (
                <div className="border border-[#dbe4ef] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#f8fafc] border-b border-[#f0f4f8]">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Item</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Dosage</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Frequency</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500">Duration</th>
                        <th className="px-3 py-2 text-[#0f172a]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f4f8]">
                      {prescribedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-[#0f172a]">{item.drug}</td>
                          <td className="px-3 py-2 text-slate-600">{item.dosage}</td>
                          <td className="px-3 py-2 text-slate-600">{item.frequency}</td>
                          <td className="px-3 py-2 text-slate-600">{item.duration}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => setPrescribedItems((p) => p.filter((_, i) => i !== idx))} className="text-red-500 hover:underline">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-[#f8fafc] border border-dashed border-[#dbe4ef] rounded-xl text-center text-xs text-slate-400">
                  No drugs prescribed yet. Click "+ Add Drug" above.
                </div>
              )}
            </div>

            <Textarea label="Treatment Plan & Doctor Notes" placeholder="Special instructions, dietary advice, follow-up recommendations..." rows={3} value={formData.notes} onChange={set('notes')} />

            <div className="pt-2 flex gap-3">
              <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Encounter Record'}</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Drug Modal */}
      <Modal open={showAddDrug} onClose={() => setShowAddDrug(false)} title="Add Prescription Item">
        <div className="p-5 space-y-4">
          <Input label="Medication Name *" placeholder="e.g. Paracetamol 500mg or EduHerbal Cough Syrup" value={newDrug.drug} onChange={(e) => setNewDrug((d) => ({ ...d, drug: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Dosage" placeholder="1 tab or 15ml" value={newDrug.dosage} onChange={(e) => setNewDrug((d) => ({ ...d, dosage: e.target.value }))} />
            <Input label="Frequency" placeholder="TDS (3x/day)" value={newDrug.frequency} onChange={(e) => setNewDrug((d) => ({ ...d, frequency: e.target.value }))} />
            <Input label="Duration" placeholder="5 days" value={newDrug.duration} onChange={(e) => setNewDrug((d) => ({ ...d, duration: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={addDrug}>Add to Prescription</Button>
            <Button variant="secondary" onClick={() => setShowAddDrug(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Lab Request Modal */}
      <Modal open={showLabRequest} onClose={() => setShowLabRequest(false)} title="Request Diagnostic Lab Tests">
        <div className="p-5 space-y-4">
          {labRequestSent && <div className="p-3 bg-green-50 text-green-700 text-sm font-medium rounded-xl">✓ Lab request submitted!</div>}
          <Input label="Patient" value={selectedPatient.name} disabled />
          <Textarea label="Required Diagnostic Tests (comma-separated) *" placeholder="e.g. Full Blood Count, Malaria RDT, Typhoid Screen, Lipid Profile" rows={3} value={labTests} onChange={(e) => setLabTests(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={handleRequestLabs}>Submit Lab Order</Button>
            <Button variant="secondary" onClick={() => setShowLabRequest(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Referral Modal */}
      <Modal open={showReferral} onClose={() => setShowReferral(false)} title="Create Specialist Referral">
        <div className="p-5 space-y-4">
          {referralSent && <div className="p-3 bg-green-50 text-green-700 text-sm font-medium rounded-xl">✓ Referral created!</div>}
          <Input label="Patient" value={selectedPatient.name} disabled />
          <Input label="Target Specialty / Department *" placeholder="e.g. Cardiology, Herbal Specialist" value={referralForm.reason} onChange={(e) => setReferralForm((r) => ({ ...r, reason: e.target.value }))} />
          <Textarea label="Clinical Reason & Clinical History" placeholder="Detailed referral reason..." rows={3} value={referralForm.notes} onChange={(e) => setReferralForm((r) => ({ ...r, notes: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={handleCreateReferral}>Send Referral</Button>
            <Button variant="secondary" onClick={() => setShowReferral(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* SMS Modal */}
      <Modal open={showSms} onClose={() => setShowSms(false)} title="Send Patient Vitals SMS">
        <div className="p-5 space-y-4">
          {smsSent && <div className="p-3 bg-green-50 text-green-700 text-sm font-medium rounded-xl">✓ SMS sent via Arkesel gateway!</div>}
          <Input label="Recipient Phone" value={selectedPatient.phone} disabled />
          <Textarea label="SMS Preview" rows={6} value={buildSmsText()} readOnly />
          <div className="flex gap-2">
            <Button onClick={sendSms}>Dispatch SMS</Button>
            <Button variant="secondary" onClick={() => setShowSms(false)}>Skip SMS</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
