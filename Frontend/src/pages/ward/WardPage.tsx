import { useState } from 'react';
import { WardBed } from '../../types/ward';
import { useAuth } from '../../contexts/AuthContext';
import { useWards } from '../../hooks/useWards';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

export default function WardPage() {
  const { activeBranch } = useAuth();
  const { beds, loading, admitPatient, dischargeBed } = useWards(activeBranch);
  const [selectedBed, setSelectedBed] = useState<WardBed | null>(null);
  const [showAdmit, setShowAdmit] = useState(false);
  const [admitForm, setAdmitForm] = useState({ patient: '', notes: '' });
  const [admitted, setAdmitted] = useState(false);

  const filtered = beds.filter((b) => activeBranch === 'All' || !b.branch || b.branch === activeBranch);
  const wards = [...new Set(filtered.map((b) => b.ward))];
  const occupied = filtered.filter((b) => b.status === 'Occupied').length;
  const available = filtered.filter((b) => b.status === 'Available').length;

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    await admitPatient({
      bedId: selectedBed.id,
      patientId: 'PAT-DYNAMIC',
      admitReason: admitForm.notes || 'Inpatient admission',
      notes: admitForm.patient,
    });
    setAdmitted(true);
    setTimeout(() => { setShowAdmit(false); setSelectedBed(null); setAdmitted(false); setAdmitForm({ patient: '', notes: '' }); }, 1500);
  };

  const handleDischarge = async (bedId: string) => {
    await dischargeBed(bedId, 'Discharged from ward');
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Ward & Admissions</h2>
          <p className="text-sm text-slate-400">{occupied} occupied · {available} available · {filtered.length} total beds</p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-5"><DepartmentGuide department="ward" /></div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600" style={{ fontFamily: 'var(--font-heading)' }}>{occupied}</p>
          <p className="text-xs text-red-500 mt-1 font-medium">Occupied</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>{available}</p>
          <p className="text-xs text-green-500 mt-1 font-medium">Available</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600" style={{ fontFamily: 'var(--font-heading)' }}>{filtered.filter((b) => b.status === 'Maintenance').length}</p>
          <p className="text-xs text-amber-500 mt-1 font-medium">Maintenance</p>
        </div>
      </div>

      {/* Ward occupancy board */}
      <div className="space-y-5">
        {wards.map((ward) => {
          const wardBeds = filtered.filter((b) => b.ward === ward);
          return (
            <div key={ward} className="bg-white rounded-xl border border-[#dbe4ef] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0f172a] text-sm" style={{ fontFamily: 'var(--font-heading)' }}>{ward}</h3>
                <span className="text-xs text-slate-400">{wardBeds.filter((b) => b.status === 'Occupied').length}/{wardBeds.length} occupied</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {wardBeds.map((bed) => (
                  <div
                    key={bed.id}
                    className={`rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-md ${
                      bed.status === 'Occupied' ? 'border-red-300 bg-red-50' :
                      bed.status === 'Maintenance' ? 'border-amber-300 bg-amber-50' :
                      'border-green-300 bg-green-50 hover:border-green-400'
                    }`}
                    onClick={() => {
                      if (bed.status === 'Available') { setSelectedBed(bed); setShowAdmit(true); }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-600">{bed.bedNumber}</span>
                      <span className={`w-2 h-2 rounded-full ${bed.status === 'Occupied' ? 'bg-red-500' : bed.status === 'Maintenance' ? 'bg-amber-500' : 'bg-green-500'}`} />
                    </div>
                    {bed.patientName ? (
                      <>
                        <p className="text-xs font-medium text-[#0f172a] truncate">{bed.patientName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Since {bed.admittedDate}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDischarge(bed.id); }}
                          className="text-[10px] text-red-600 font-medium mt-1.5 hover:underline"
                        >
                          Discharge
                        </button>
                      </>
                    ) : (
                      <p className={`text-[10px] font-medium mt-1 ${bed.status === 'Available' ? 'text-green-600' : 'text-amber-600'}`}>
                        {bed.status}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        {[{ color: 'bg-red-400', label: 'Occupied' }, { color: 'bg-green-400', label: 'Available (click to admit)' }, { color: 'bg-amber-400', label: 'Maintenance' }].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Admit modal */}
      <Modal open={showAdmit} onClose={() => { setShowAdmit(false); setSelectedBed(null); }} title={`Admit Patient — Bed ${selectedBed?.bedNumber}`}>
        <form onSubmit={handleAdmit} className="p-6 space-y-4">
          {admitted && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Patient admitted successfully!</div>}
          <Input label="Patient Name *" placeholder="Search patient..." required value={admitForm.patient} onChange={(e) => setAdmitForm((f) => ({ ...f, patient: e.target.value }))} />
          <Textarea label="Admitting Notes" placeholder="Reason for admission, notes..." rows={3} value={admitForm.notes} onChange={(e) => setAdmitForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2">
            <Button type="submit">Confirm Admission</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowAdmit(false); setSelectedBed(null); }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
