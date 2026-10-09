import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { Badge, statusBadge } from '../components/ui/Badge';
import { DepartmentGuide } from '../components/ui/DepartmentGuide';

const NEU_BG = '#e0e5ec';
const neuRaised = '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff';
const neuInset = 'inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, activeBranch, isCTO, isAdmin } = useAuth();
  const { overview, loading, refresh } = useDashboard(activeBranch);

  const todayAppts: any[] = overview?.todayAppointments || [];
  const pendingLabs: any[] = overview?.pendingLabOrders || overview?.pendingLabs || [];
  const lowStock: any[] = overview?.lowStock || [];
  const outstandingInv: any[] = overview?.outstandingBalances || [];

  const patientsTodayCount = overview?.kpis?.patientsToday?.count ?? todayAppts.length;
  const completedApptsCount = overview?.kpis?.patientsToday?.completedCount ?? todayAppts.filter((a) => a.status === 'Completed').length;
  const patientsDelta = overview?.kpis?.patientsToday?.deltaLabel ?? `+${patientsTodayCount} today`;

  const revenue = overview?.kpis?.revenue?.collectedToday ?? overview?.totalRevenue ?? 0;
  const revenueDelta = overview?.kpis?.revenue?.deltaLabel ?? '+12% week';

  const occupiedBedsCount = overview?.kpis?.bedOccupancy?.occupiedCount ?? overview?.occupiedBeds ?? 0;
  const totalBedsCount = overview?.kpis?.bedOccupancy?.totalBedsCount ?? overview?.totalBeds ?? 9;
  const occupancyPercent = overview?.kpis?.bedOccupancy?.occupancyPercent ?? (totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0);

  const lowStockCount = overview?.kpis?.inventoryAlerts?.count ?? lowStock.length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {activeBranch === 'All' ? 'Viewing all branches' : `${activeBranch} Branch`} · {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {(isCTO() || isAdmin()) && (
          <button
            onClick={() => onNavigate('user_management')}
            className="flex items-center gap-2 px-4 py-2 bg-[#0a1628] text-white text-sm rounded-lg hover:bg-[#1b4fce] transition-colors font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M8 1l6 2.5v5C14 11 11 13.5 8 15c-3-1.5-6-4-6-6.5v-5L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            {isCTO() ? 'CTO Panel' : 'Admin Panel'}
          </button>
        )}
      </div>

      {/* Stats — neumorphic style on 2 feature cards, standard on 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Neumorphic featured card */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2 col-span-1"
          style={{ background: NEU_BG, boxShadow: neuRaised }}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600" style={{ background: NEU_BG, boxShadow: neuInset }}>
              <PatientIcon />
            </div>
            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{patientsDelta}</span>
          </div>
          <p className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{patientsTodayCount}</p>
          <p className="text-xs font-medium text-slate-600">Patients Today</p>
          <p className="text-[10px] text-slate-400">{completedApptsCount} completed</p>
        </div>

        {/* Neumorphic featured card */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2 col-span-1"
          style={{ background: NEU_BG, boxShadow: neuRaised }}
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-green-600" style={{ background: NEU_BG, boxShadow: neuInset }}>
              <MoneyIcon />
            </div>
            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{revenueDelta}</span>
          </div>
          <p className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>GHS {revenue.toLocaleString()}</p>
          <p className="text-xs font-medium text-slate-600">Revenue</p>
          <p className="text-[10px] text-slate-400">Collected today</p>
        </div>

        {/* Standard white card */}
        <div className="bg-white rounded-2xl border border-[#dbe4ef] p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <BedIcon />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{occupiedBedsCount}/{totalBedsCount}</p>
          <p className="text-xs font-medium text-slate-600">Ward Occupancy</p>
          <p className="text-[10px] text-slate-400">{occupancyPercent}% occupied</p>
        </div>

        {/* Standard white card */}
        <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${lowStockCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#dbe4ef]'}`}>
          <div className="flex items-center justify-between">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertIcon />
            </div>
            {lowStockCount > 0 && <span className="text-[10px] font-bold text-red-600">Action needed</span>}
          </div>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-[#0f172a]'}`} style={{ fontFamily: 'var(--font-heading)' }}>{lowStockCount}</p>
          <p className="text-xs font-medium text-slate-600">Low Stock Alerts</p>
          <p className="text-[10px] text-slate-400">Items below reorder level</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#dbe4ef] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0f172a] text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Today's Appointments</h3>
            <button onClick={() => onNavigate('appointments')} className="text-xs text-[#1b4fce] hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {todayAppts.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors group cursor-pointer" onClick={() => onNavigate('appointments')}>
                <div className="w-8 h-8 rounded-full bg-[#e8eef7] flex items-center justify-center text-xs font-bold text-[#1b4fce] shrink-0">
                  {a.patientName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0f172a] truncate">{a.patientName}</p>
                  <p className="text-xs text-slate-400">{a.doctorName} · {a.department}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-slate-500">{a.time}</p>
                  <Badge variant={statusBadge(a.status)} className="mt-0.5">{a.status}</Badge>
                </div>
              </div>
            ))}
            {todayAppts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No appointments today</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending labs */}
          <div className="bg-white rounded-xl border border-[#dbe4ef] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0f172a] text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Pending Lab Orders</h3>
              <button onClick={() => onNavigate('lab')} className="text-xs text-[#1b4fce] hover:underline">{pendingLabs.length}</button>
            </div>
            <div className="space-y-2">
              {pendingLabs.slice(0, 3).map((l: any) => (
                <div key={l.id} className="flex items-center gap-2 p-2 bg-[#f8fafc] rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#0f172a] truncate">{l.patientName}</p>
                    <p className="text-[10px] text-slate-400">{Array.isArray(l.tests) ? l.tests.join(', ') : (l.testSummary || 'Lab investigation')}</p>
                  </div>
                  <Badge variant={statusBadge(l.status)} className="text-[10px]">{l.status}</Badge>
                </div>
              ))}
              {pendingLabs.length === 0 && <p className="text-xs text-slate-400 text-center py-2">All clear</p>}
            </div>
          </div>

          {/* Low stock */}
          <div className="bg-white rounded-xl border border-[#dbe4ef] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0f172a] text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Low Stock</h3>
              <button onClick={() => onNavigate('inventory')} className="text-xs text-[#1b4fce] hover:underline">{lowStock.length} items</button>
            </div>
            <div className="space-y-2">
              {lowStock.slice(0, 4).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#0f172a] truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{s.branch || 'Main'}</p>
                  </div>
                  <span className="text-xs font-semibold text-red-600 shrink-0">{s.quantity} {s.unit || 'units'}</span>
                </div>
              ))}
              {lowStock.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Stock levels OK</p>}
            </div>
          </div>

          {/* Outstanding invoices */}
          <div className="bg-white rounded-xl border border-[#dbe4ef] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#0f172a] text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Outstanding Balances</h3>
              <button onClick={() => onNavigate('billing')} className="text-xs text-[#1b4fce] hover:underline">View</button>
            </div>
            {outstandingInv.slice(0, 3).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-[#f0f4f8] last:border-0">
                <div>
                  <p className="text-xs font-medium text-[#0f172a]">{inv.patientName}</p>
                  <p className="text-[10px] text-slate-400">{inv.invoiceNumber || inv.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-red-600">
                    GHS {Number(inv.balance ?? ((inv.total || 0) - (inv.paid || 0))).toLocaleString()}
                  </p>
                  <Badge variant={statusBadge(inv.status)} className="text-[10px]">{inv.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Guide */}
      <DepartmentGuide department="dashboard" />

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
        <h3 className="font-semibold text-[#0f172a] text-sm mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Register Patient', page: 'new_patient', icon: '➕', color: 'bg-blue-50 text-blue-700 border-blue-200' },
            { label: 'Book Appointment', page: 'appointments', icon: '📅', color: 'bg-teal-50 text-teal-700 border-teal-200' },
            { label: 'Pharmacy Queue', page: 'pharmacy', icon: '💊', color: 'bg-green-50 text-green-700 border-green-200' },
            { label: 'Lab Orders', page: 'lab', icon: '🧪', color: 'bg-orange-50 text-orange-700 border-orange-200' },
            { label: 'Create Invoice', page: 'billing', icon: '🧾', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { label: 'Ward Board', page: 'ward', icon: '🏥', color: 'bg-pink-50 text-pink-700 border-pink-200' },
          ].map((action) => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:shadow-sm ${action.color}`}
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientIcon() { return <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function MoneyIcon() { return <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" /><circle cx="8" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.5" /><path d="M4.5 8.5h-1M12.5 8.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function BedIcon() { return <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none"><path d="M1 10V6a2 2 0 012-2h10a2 2 0 012 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M1 10h14v2H1z" stroke="currentColor" strokeWidth="1.5" /><circle cx="5" cy="7" r="1" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function AlertIcon() { return <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none"><path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
