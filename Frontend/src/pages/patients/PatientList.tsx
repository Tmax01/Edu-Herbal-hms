import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState } from 'react';
import { Patient } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { usePatients } from '../../hooks/usePatients';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface PatientListProps {
  onNavigate: (page: string, data?: unknown) => void;
}

export default function PatientList({ onNavigate }: PatientListProps) {
  const { activeBranch } = useAuth();
  const [search, setSearch] = useState('');
  const { patients, loading, error } = usePatients(search, activeBranch);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Patient Registry</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? 'Loading patients...' : `${patients.length} patients · ${activeBranch === 'All' ? 'All branches' : activeBranch}`}
          </p>
        </div>
        <Button onClick={() => onNavigate('new_patient')} icon={<PlusIcon />}>Register Patient</Button>
      </div>

      <div className="mb-5"><DepartmentGuide department="patients" /></div>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, MRN, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#dbe4ef] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce] focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f8]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">MRN</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Allergies</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f8]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">Loading patient registry...</td>
              </tr>
            ) : (
              patients.map((p) => (
                <PatientRow key={p.id} patient={p} onClick={() => onNavigate('patient_profile', p)} />
              ))
            )}
            {!loading && patients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">No patients found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PatientRow({ patient: p, onClick }: { patient: Patient; onClick: () => void }) {
  const age = p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : 'N/A';
  return (
    <tr className="hover:bg-[#f8fafc] transition-colors cursor-pointer group" onClick={onClick}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1b4fce] to-[#0d9488] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {p.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">{p.name}</p>
            <p className="text-xs text-slate-400">{p.gender} · {age} yrs · {p.bloodGroup}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="font-mono text-xs text-slate-600">{p.mrn}</span>
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <p className="text-xs text-slate-600">{p.phone}</p>
        {p.nhisId && <p className="text-[10px] text-slate-400 mt-0.5">NHIS: {p.nhisId}</p>}
      </td>
      <td className="px-4 py-3">
        <Badge variant={p.branch === 'Accra' ? 'default' : 'teal'}>{p.branch}</Badge>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {p.allergies && p.allergies.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {p.allergies.map((a: string) => <Badge key={a} variant="danger" className="text-[10px]">{a}</Badge>)}
          </div>
        ) : (
          <span className="text-xs text-slate-300">None</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="text-xs text-[#1b4fce] hover:underline font-medium"
        >
          View Profile →
        </button>
      </td>
    </tr>
  );
}

function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
