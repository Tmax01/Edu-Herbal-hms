import { useState } from 'react';
import { NursingNote } from '../../types/nursing';
import { useAuth } from '../../contexts/AuthContext';
import { useNursing } from '../../hooks/useNursing';
import { useWards } from '../../hooks/useWards';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

const noteTypeColors: Record<NursingNote['type'], string> = {
  Routine: 'bg-slate-100 text-slate-600',
  Medication: 'bg-blue-100 text-blue-700',
  Observation: 'bg-amber-100 text-amber-700',
  Incident: 'bg-red-100 text-red-700',
};

export default function NursingPage() {
  const { activeBranch, user } = useAuth();
  const [selectedBed, setSelectedBed] = useState('');
  const { beds: wardBeds, loading: loadingWards } = useWards(activeBranch);
  const { notes, addNote } = useNursing(activeBranch, selectedBed);
  const [showAdd, setShowAdd] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    bedId: '', patientName: '', type: 'Routine' as NursingNote['type'],
    bp: '', pulse: '', temp: '', spo2: '', note: '',
  });

  const occupiedBeds = wardBeds.filter((b) => (b.status === 'Occupied' || b.patientName) && (activeBranch === 'All' || b.branch === activeBranch || !b.branch));
  const selectableBeds = occupiedBeds.length > 0 ? occupiedBeds : wardBeds;
  const filteredNotes = notes.filter((n) => !selectedBed || n.bedId === selectedBed);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const bed = selectableBeds.find((b) => b.id === form.bedId);
    
    // Parse blood pressure e.g. 120/80
    let systolicBp: number | undefined;
    let diastolicBp: number | undefined;
    if (form.bp && form.bp.includes('/')) {
      const parts = form.bp.split('/');
      systolicBp = parseInt(parts[0], 10) || undefined;
      diastolicBp = parseInt(parts[1], 10) || undefined;
    }

    await addNote({
      bedId: form.bedId,
      noteType: form.type,
      content: form.note,
      systolicBp,
      diastolicBp,
      pulseRate: form.pulse ? parseInt(form.pulse, 10) : undefined,
      temperature: form.temp ? parseFloat(form.temp) : undefined,
      spo2: form.spo2 ? parseInt(form.spo2.replace('%', ''), 10) : undefined,
    }, bed?.patientName || form.patientName, user?.name);

    setSaved(true);
    setTimeout(() => { setShowAdd(false); setSaved(false); setForm({ bedId: '', patientName: '', type: 'Routine', bp: '', pulse: '', temp: '', spo2: '', note: '' }); }, 1300);
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Nursing Notes & Daily Chart</h2>
          <p className="text-sm text-slate-400">{occupiedBeds.length} inpatients · {notes.length} notes today</p>
        </div>
        <Button onClick={() => setShowAdd(true)} icon={<PlusIcon />}>Add Nursing Note</Button>
      </div>

      {/* Patient filter */}
      <div className="mb-5"><DepartmentGuide department="nursing" /></div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedBed('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${!selectedBed ? 'bg-[#1b4fce] text-white' : 'bg-white border border-[#dbe4ef] text-slate-600'}`}
        >
          All Patients
        </button>
        {selectableBeds.map((bed) => (
          <button
            key={bed.id}
            onClick={() => setSelectedBed(selectedBed === bed.id ? '' : bed.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedBed === bed.id ? 'bg-[#1b4fce] text-white' : 'bg-white border border-[#dbe4ef] text-slate-600'}`}
          >
            <span className="font-mono">{bed.bedNumber}</span>
            <span>{bed.patientName || 'Available'}</span>
          </button>
        ))}
      </div>

      {/* Vitals summary for selected patient */}
      {selectedBed && (
        <div className="mb-4">
          {filteredNotes.slice(0, 1).map((n) => (
            <div key={n.id} className="bg-white rounded-xl border border-[#dbe4ef] p-4 flex gap-5 flex-wrap">
              <p className="text-sm font-semibold text-[#0f172a] w-full">{n.patientName} — Latest Vitals ({n.timestamp})</p>
              {[
                { label: 'BP', value: n.vitals.bp, unit: 'mmHg', icon: '🫀', alert: false },
                { label: 'Pulse', value: n.vitals.pulse, unit: 'bpm', icon: '💓', alert: parseInt(n.vitals.pulse) > 100 || parseInt(n.vitals.pulse) < 60 },
                { label: 'Temp', value: n.vitals.temp, unit: '°C', icon: '🌡️', alert: parseFloat(n.vitals.temp) > 37.5 },
                { label: 'SpO₂', value: n.vitals.spo2, unit: '', icon: '🫁', alert: parseInt(n.vitals.spo2) < 95 },
              ].map((v) => (
                <div key={v.label} className={`px-4 py-3 rounded-xl flex-1 min-w-[80px] text-center ${v.alert ? 'bg-red-50 border border-red-200' : 'bg-[#f8fafc] border border-[#dbe4ef]'}`}>
                  <p className="text-lg">{v.icon}</p>
                  <p className={`text-base font-bold mt-1 ${v.alert ? 'text-red-600' : 'text-[#0f172a]'}`} style={{ fontFamily: 'var(--font-heading)' }}>{v.value}</p>
                  <p className="text-[10px] text-slate-400">{v.label} {v.unit}</p>
                  {v.alert && <p className="text-[9px] text-red-500 font-bold mt-0.5">⚠️ FLAG</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Notes timeline */}
      <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#f0f4f8]">
          <h3 className="text-sm font-semibold text-[#0f172a]">Nursing Notes Timeline</h3>
        </div>
        <div className="divide-y divide-[#f0f4f8]">
          {filteredNotes.map((note) => (
            <div key={note.id} className="p-5 hover:bg-[#f8fafc] transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#e8eef7] flex items-center justify-center text-[#1b4fce] shrink-0">
                    <NurseIcon />
                  </div>
                  <div className="w-0.5 h-full bg-[#f0f4f8] mt-1 min-h-4" />
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-[#0f172a]">{note.patientName}</p>
                    <span className="font-mono text-xs text-slate-400">{note.bedId}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${noteTypeColors[note.type]}`}>{note.type}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">{note.timestamp} · {note.nurseName}</p>

                  {/* Vitals row */}
                  <div className="flex gap-3 mb-2 flex-wrap">
                    {[
                      { label: 'BP', value: note.vitals.bp },
                      { label: 'Pulse', value: `${note.vitals.pulse} bpm` },
                      { label: 'Temp', value: `${note.vitals.temp}°C` },
                      { label: 'SpO₂', value: note.vitals.spo2 },
                    ].map((v) => (
                      <span key={v.label} className="text-xs bg-[#f0f4f8] text-slate-700 px-2 py-0.5 rounded font-mono">
                        {v.label}: {v.value}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">{note.note}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <p className="text-center text-slate-400 py-10 text-sm">No notes found</p>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Nursing Note" width="max-w-2xl">
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Nursing note saved!</div>}
          <div className="grid grid-cols-2 gap-3">
            <Select label="Patient / Bed *" required value={form.bedId} onChange={set('bedId')}>
              <option value="">Select patient / bed...</option>
              {selectableBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.ward} — Bed {b.bedNumber} {b.patientName ? `(${b.patientName})` : ''}
                </option>
              ))}
            </Select>
            <Select label="Note Type *" required value={form.type} onChange={set('type')}>
              <option>Routine</option><option>Medication</option><option>Observation</option><option>Incident</option>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Vitals</p>
            <div className="grid grid-cols-4 gap-3">
              <Input label="BP (mmHg)" placeholder="120/80" value={form.bp} onChange={set('bp')} />
              <Input label="Pulse (bpm)" placeholder="72" value={form.pulse} onChange={set('pulse')} />
              <Input label="Temp (°C)" placeholder="36.6" value={form.temp} onChange={set('temp')} />
              <Input label="SpO₂" placeholder="98%" value={form.spo2} onChange={set('spo2')} />
            </div>
          </div>
          <Textarea label="Clinical Notes *" placeholder="Describe patient condition, medications administered, observations..." rows={4} required value={form.note} onChange={set('note')} />
          <div className="flex gap-2">
            <Button type="submit">Save Note</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function NurseIcon() { return <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5" /><path d="M3 14v-1a5 5 0 0110 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
