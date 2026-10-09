import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePharmacy } from '../../hooks/usePharmacy';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

// CDSS: known drug interactions (drug A + drug B → warning)
const drugInteractions: { drugs: string[]; warning: string; severity: 'high' | 'moderate' }[] = [
  { drugs: ['Amlodipine', 'Simvastatin'], warning: 'Amlodipine increases Simvastatin plasma levels — risk of myopathy. Use lower statin dose.', severity: 'moderate' },
  { drugs: ['Lisinopril', 'Potassium'], warning: 'ACE inhibitors + potassium supplements may cause hyperkalaemia.', severity: 'moderate' },
  { drugs: ['Metformin', 'Contrast'], warning: 'Hold Metformin 48h before/after iodinated contrast — risk of lactic acidosis.', severity: 'high' },
  { drugs: ['Aspirin', 'Ibuprofen'], warning: 'NSAIDs may reduce the cardioprotective effect of low-dose Aspirin.', severity: 'moderate' },
  { drugs: ['Warfarin', 'Aspirin'], warning: 'Concurrent use significantly increases bleeding risk. Monitor INR closely.', severity: 'high' },
  { drugs: ['Ciprofloxacin', 'Metformin'], warning: 'Fluoroquinolones may affect blood glucose — monitor closely in diabetic patients.', severity: 'moderate' },
  { drugs: ['Artemether', 'Lumefantrine'], warning: 'Artemether/Lumefantrine combined — standard dosing only. Avoid other QT-prolonging drugs.', severity: 'moderate' },
];

function checkInteractions(items: { drug: string }[]): typeof drugInteractions {
  const drugNames = items.map((i) => i.drug.toLowerCase());
  return drugInteractions.filter((inter) =>
    inter.drugs.some((d) => drugNames.some((dn) => dn.includes(d.toLowerCase())))
    && inter.drugs.filter((d) => drugNames.some((dn) => dn.includes(d.toLowerCase()))).length >= 1
  );
}

export default function PharmacyPage() {
  const { activeBranch } = useAuth();
  const [view, setView] = useState<'queue' | 'stock'>('queue');

  const { prescriptions, stockItems, loading, error, dispensePrescription } = usePharmacy(activeBranch);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Pharmacy</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Loading pharmacy data...' : `${activeBranch === 'All' ? 'All branches' : activeBranch}`}
          </p>
        </div>
        <div className="flex bg-[#f0f4f8] rounded-lg p-0.5">
          {(['queue', 'stock'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${view === v ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}
            >
              {v === 'queue' ? 'Prescription Queue' : 'Stock Overview'}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <DepartmentGuide department="pharmacy" />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {view === 'queue' ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-slate-400 py-12">Loading prescription worklist...</p>
          ) : (
            prescriptions.map((rx) => {
              const isDispensed = rx.status === 'Dispensed';
              const interactions = checkInteractions(rx.items);
              const hasHighAlert = interactions.some((i) => i.severity === 'high');
              return (
                <div
                  key={rx.id}
                  className={`bg-white rounded-xl border p-5 transition-all ${isDispensed ? 'border-green-200 opacity-60' : hasHighAlert ? 'border-red-300' : 'border-[#dbe4ef]'}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#0f172a]">{rx.patientName}</p>
                        <Badge variant={rx.type === 'Herbal' ? 'teal' : 'default'}>{rx.type}</Badge>
                        <Badge variant={statusBadge(rx.status)}>{rx.status}</Badge>
                        {interactions.length > 0 && !isDispensed && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasHighAlert ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            ⚠ {interactions.length} Interaction{interactions.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Prescribed by {rx.doctorName} · {rx.date} · {rx.id}</p>
                    </div>
                    {!isDispensed && (
                      <Button size="sm" variant="teal" onClick={() => dispensePrescription(rx.id)}>
                        Confirm Dispense (FEFO)
                      </Button>
                    )}
                  </div>

                  {/* CDSS Drug Interaction Alerts */}
                  {interactions.length > 0 && !isDispensed && (
                    <div className="mb-3 space-y-1.5">
                      {interactions.map((inter, i) => (
                        <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${inter.severity === 'high' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                          <span className="shrink-0 font-bold">{inter.severity === 'high' ? '🚨' : '⚠️'}</span>
                          <div>
                            <p className="font-semibold mb-0.5">
                              {inter.severity === 'high' ? 'HIGH' : 'MODERATE'} — Clinical Decision Alert
                            </p>
                            <p>{inter.warning}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {rx.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[#f8fafc] rounded-lg">
                        <div className="w-6 h-6 rounded-md bg-[#e8eef7] flex items-center justify-center text-[#1b4fce] shrink-0">
                          <PillIcon />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">{item.drug}</p>
                          <p className="text-xs text-slate-400">{item.dosage} · {item.frequency} · {item.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
          {!loading && prescriptions.length === 0 && (
            <p className="text-center text-slate-400 py-12">No pending prescriptions</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f4f8]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Expiry (FEFO)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {stockItems.map((s) => {
                const isLow = s.quantity <= s.reorderLevel;
                return (
                  <tr key={s.id} className={`hover:bg-[#f8fafc] ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-[#0f172a]">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.supplier || `ID: ${s.id}`}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.category === 'Herbal' ? 'teal' : s.category === 'Raw Material' ? 'warning' : 'muted'}>{s.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-[#0f172a]'}`}>
                        {s.quantity} {s.unit}
                      </p>
                      <p className="text-[10px] text-slate-400">Reorder at {s.reorderLevel}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs font-mono text-slate-600">{s.batchNo}</p>
                      <p className="text-xs text-slate-400">Exp: {s.expiryDate}</p>
                    </td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <Badge variant="danger">Low Stock</Badge>
                      ) : (
                        <Badge variant="success">Adequate</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PillIcon() { return <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none"><rect x="2" y="6" width="12" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 6v4" stroke="currentColor" strokeWidth="1.5" /></svg>; }
