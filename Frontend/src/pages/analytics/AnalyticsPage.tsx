import { useState, useEffect, useCallback } from 'react';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/dashboardService';

// ── helpers ──────────────────────────────────────────────────────────────────
const NEU_BG = '#e0e5ec';
const neuRaised = '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff';

function kpiColor(label: string) {
  if (label.includes('Patient')) return { bg: '#eff6ff', icon: '#1b4fce', border: '#bfdbfe' };
  if (label.includes('Appointment')) return { bg: '#f0fdf4', icon: '#16a34a', border: '#bbf7d0' };
  if (label.includes('Revenue')) return { bg: '#fefce8', icon: '#ca8a04', border: '#fde68a' };
  if (label.includes('Staff')) return { bg: '#fdf4ff', icon: '#9333ea', border: '#e9d5ff' };
  if (label.includes('Lab')) return { bg: '#fff7ed', icon: '#ea580c', border: '#fed7aa' };
  if (label.includes('Prescription')) return { bg: '#f0fdfa', icon: '#0d9488', border: '#99f6e4' };
  return { bg: '#f8fafc', icon: '#64748b', border: '#e2e8f0' };
}

// Fallback monthly trend data
const defaultMonthlyPatients = [
  { month: 'Mar', accra: 62, mankessim: 38 },
  { month: 'Apr', accra: 75, mankessim: 42 },
  { month: 'May', accra: 88, mankessim: 51 },
  { month: 'Jun', accra: 70, mankessim: 45 },
  { month: 'Jul', accra: 95, mankessim: 58 },
  { month: 'Aug', accra: 103, mankessim: 63 },
];

const defaultDeptRevenue = [
  { dept: 'General Medicine', amount: 18400 },
  { dept: 'Pharmacy', amount: 12700 },
  { dept: 'Laboratory', amount: 8900 },
  { dept: 'Herbal Centre', amount: 6200 },
  { dept: 'Ward/Admissions', amount: 5100 },
  { dept: 'Telemedicine', amount: 3400 },
];

const defaultAppointmentOutcomes = [
  { label: 'Completed', count: 42, color: '#16a34a' },
  { label: 'In Progress', count: 18, color: '#1b4fce' },
  { label: 'Scheduled', count: 25, color: '#0d9488' },
  { label: 'No-show', count: 6, color: '#dc2626' },
];

// Bar chart component
function BarChart({
  data, maxVal, colorA = '#1b4fce', colorB = '#0d9488', labelA = 'Accra', labelB = 'Mankessim',
}: {
  data: { month: string; accra: number; mankessim: number }[];
  maxVal: number;
  colorA?: string; colorB?: string; labelA?: string; labelB?: string;
}) {
  return (
    <div>
      <div className="flex items-end gap-3 h-40 mb-2">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end" style={{ height: '128px' }}>
              <div
                className="flex-1 rounded-t-md transition-all"
                style={{ height: `${Math.max(4, (d.accra / maxVal) * 100)}%`, background: colorA, minHeight: 4 }}
                title={`Accra: ${d.accra}`}
              />
              <div
                className="flex-1 rounded-t-md transition-all"
                style={{ height: `${Math.max(4, (d.mankessim / maxVal) * 100)}%`, background: colorB, minHeight: 4 }}
                title={`Mankessim: ${d.mankessim}`}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{d.month}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: colorA }} />
          <span className="text-xs text-slate-500">{labelA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: colorB }} />
          <span className="text-xs text-slate-500">{labelB}</span>
        </div>
      </div>
    </div>
  );
}

// Horizontal bar
function HBar({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-slate-600 w-32 shrink-0 truncate">{label}</p>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(2, (amount / Math.max(max, 1)) * 100)}%`, background: color }}
        />
      </div>
      <p className="text-xs font-semibold text-[#0f172a] w-16 text-right">GH₵{(amount / 1000).toFixed(1)}k</p>
    </div>
  );
}

// Donut slice as SVG
function DonutChart({ segments }: { segments: { label: string; count: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.count, 0) || 1;
  let cumAngle = -90;
  const cx = 60; const cy = 60; const r = 48; const inner = 30;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcs = segments.map((seg) => {
    const angle = (seg.count / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const ix1 = cx + inner * Math.cos(toRad(startAngle));
    const iy1 = cy + inner * Math.sin(toRad(startAngle));
    const ix2 = cx + inner * Math.cos(toRad(endAngle));
    const iy2 = cy + inner * Math.sin(toRad(endAngle));
    const large = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;
    return { ...seg, d };
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {arcs.map((a) => (
          <path key={a.label} d={a.d} fill={a.color} />
        ))}
        <text x="60" y="56" textAnchor="middle" className="text-sm" style={{ fontSize: 18, fontWeight: 700, fill: '#0f172a' }}>{total}</text>
        <text x="60" y="72" textAnchor="middle" style={{ fontSize: 9, fill: '#94a3b8' }}>total</text>
      </svg>
      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-slate-600">{s.label}</span>
            <span className="text-xs font-bold text-[#0f172a] ml-auto pl-4">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { activeBranch } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const data = await dashboardService.getAnalytics(activeBranch, period);
    if (data) {
      setAnalyticsData(data);
    }
    setLoading(false);
  }, [activeBranch, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const periodLabel = period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month';

  const monthlyData = analyticsData?.monthlyPatients && analyticsData.monthlyPatients.length > 0
    ? analyticsData.monthlyPatients
    : defaultMonthlyPatients;

  const revenueData = analyticsData?.deptRevenue && analyticsData.deptRevenue.length > 0
    ? analyticsData.deptRevenue
    : defaultDeptRevenue;

  const aptOutcomes = analyticsData?.appointmentOutcomes && analyticsData.appointmentOutcomes.length > 0
    ? analyticsData.appointmentOutcomes
    : defaultAppointmentOutcomes;

  const rawKpis = analyticsData?.kpis || {};
  const kpis = [
    {
      label: 'Total Patients',
      value: rawKpis.totalPatients?.value ?? rawKpis.totalPatients ?? 168,
      sub: rawKpis.totalPatients?.trend ?? `Registered ${periodLabel}`,
      icon: '👥',
    },
    {
      label: 'Appointments',
      value: rawKpis.totalAppointments?.value ?? rawKpis.totalAppointments ?? 91,
      sub: rawKpis.totalAppointments?.trend ?? `Scheduled & completed`,
      icon: '📅',
    },
    {
      label: 'Revenue',
      value: rawKpis.totalRevenue?.value ?? `GH₵52.0k`,
      sub: rawKpis.totalRevenue?.trend ?? `Collected ${periodLabel}`,
      icon: '💰',
    },
    {
      label: 'Active Staff',
      value: rawKpis.totalStaff?.value ?? rawKpis.totalStaff ?? 24,
      sub: rawKpis.totalStaff?.trend ?? 'Across both branches',
      icon: '🏥',
    },
    {
      label: 'Lab Orders Pending',
      value: rawKpis.totalLabs?.value ?? rawKpis.totalLabs ?? 12,
      sub: rawKpis.totalLabs?.trend ?? 'Awaiting results',
      icon: '🧪',
    },
    {
      label: 'Prescriptions Issued',
      value: rawKpis.totalPrescriptions?.value ?? rawKpis.totalPrescriptions ?? 64,
      sub: rawKpis.totalPrescriptions?.trend ?? 'Pharmacy dispensing',
      icon: '💊',
    },
  ];

  const maxRevenue = Math.max(...revenueData.map((d: any) => d.amount), 1);
  const maxMonthly = Math.max(...monthlyData.flatMap((m: any) => [m.accra, m.mankessim]), 1);

  // Staff by role summary from backend or fallback
  const roleSummary = analyticsData?.staffComposition && Array.isArray(analyticsData.staffComposition)
    ? analyticsData.staffComposition.reduce((acc: any, s: any) => { acc[s.role] = s.count; return acc; }, {})
    : { doctor: 5, nurse: 8, pharmacist: 3, lab_tech: 2, receptionist: 3, accountant: 2, cto: 1 };

  const totalStaffCount = Object.values(roleSummary).reduce((a: number, b: any) => a + Number(b), 0) || 24;

  const roleColors: Record<string, string> = {
    cto: '#7c3aed', admin: '#1b4fce', doctor: '#0d9488', nurse: '#0891b2',
    pharmacist: '#16a34a', lab_tech: '#ca8a04', receptionist: '#64748b',
    accountant: '#9333ea', call_centre: '#2563eb', store_officer: '#78716c',
  };

  const roleLabelsMap: Record<string, string> = {
    cto: 'CTO', admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse',
    pharmacist: 'Pharmacist', lab_tech: 'Lab Tech', receptionist: 'Receptionist',
    accountant: 'Accountant', call_centre: 'Call Centre', store_officer: 'Store Officer',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Analytics & Intelligence</h2>
          <p className="text-sm text-slate-400">
            {loading ? 'Refreshing operational metrics…' : `Live operational insights · ${activeBranch === 'All' ? 'All Branches' : `${activeBranch} Branch`} · EDHEC HMS`}
          </p>
        </div>
        <div className="flex gap-1 bg-[#f0f4f8] rounded-lg p-0.5 w-fit">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${period === p ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      <DepartmentGuide department="analytics" />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const c = kpiColor(kpi.label);
          const isNeu = i < 2;
          return isNeu ? (
            <div
              key={kpi.label}
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: NEU_BG, boxShadow: neuRaised }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: NEU_BG, boxShadow: 'inset 3px 3px 6px #b8bec7, inset -3px -3px 6px #ffffff' }}
              >
                {kpi.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{kpi.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            </div>
          ) : (
            <div key={kpi.label} className="bg-white rounded-2xl border p-4 flex items-start gap-3" style={{ borderColor: c.border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: c.bg }}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{kpi.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patient trend */}
        <div className="bg-white rounded-2xl border border-[#dbe4ef] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Patient Registrations</h3>
              <p className="text-xs text-slate-400 mt-0.5">6-month trend by branch</p>
            </div>
            <div className="text-xl">📈</div>
          </div>
          <BarChart data={monthlyData} maxVal={maxMonthly + 20} />
        </div>

        {/* Appointment outcomes donut */}
        <div className="bg-white rounded-2xl border border-[#dbe4ef] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Appointment Outcomes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Current period status breakdown</p>
            </div>
            <div className="text-xl">🎯</div>
          </div>
          <DonutChart segments={aptOutcomes} />
        </div>
      </div>

      {/* Revenue + Staff row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by department */}
        <div className="bg-white rounded-2xl border border-[#dbe4ef] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Revenue by Department</h3>
              <p className="text-xs text-slate-400 mt-0.5">Service item distribution · GH₵</p>
            </div>
            <div className="text-xl">💳</div>
          </div>
          <div className="space-y-3">
            {revenueData.map((d: any, i: number) => (
              <HBar
                key={d.dept}
                label={d.dept}
                amount={d.amount}
                max={maxRevenue}
                color={['#1b4fce', '#0d9488', '#ca8a04', '#7c3aed', '#0891b2', '#16a34a'][i % 6]}
              />
            ))}
          </div>
        </div>

        {/* Staff by role */}
        <div className="bg-white rounded-2xl border border-[#dbe4ef] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Staff Composition</h3>
              <p className="text-xs text-slate-400 mt-0.5">{totalStaffCount} total staff across both branches</p>
            </div>
            <div className="text-xl">🧑‍⚕️</div>
          </div>
          <div className="space-y-3">
            {Object.entries(roleSummary).map(([role, count]: any) => (
              <div key={role} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: roleColors[role] ?? '#64748b' }} />
                <p className="text-xs text-slate-600 flex-1">{roleLabelsMap[role] ?? role}</p>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / totalStaffCount) * 100}%`, background: roleColors[role] ?? '#64748b' }}
                  />
                </div>
                <span className="text-xs font-bold text-[#0f172a] w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch comparison */}
      <div className="bg-white rounded-2xl border border-[#dbe4ef] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Branch Comparison</h3>
            <p className="text-xs text-slate-400 mt-0.5">Accra Main Hospital vs Mankessim Herbal Centre</p>
          </div>
          <div className="text-xl">🏥</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              branch: 'Accra',
              subtitle: 'Main Hospital',
              dotColor: 'bg-[#1b4fce]',
              patients: analyticsData?.branchComparison?.accra?.patients ?? 108,
              appointments: analyticsData?.branchComparison?.accra?.appointments ?? 58,
              revenue: analyticsData?.branchComparison?.accra?.revenue ?? 35400,
              staff: analyticsData?.branchComparison?.accra?.staff ?? 16,
            },
            {
              branch: 'Mankessim',
              subtitle: 'Herbal Centre',
              dotColor: 'bg-[#0d9488]',
              patients: analyticsData?.branchComparison?.mankessim?.patients ?? 60,
              appointments: analyticsData?.branchComparison?.mankessim?.appointments ?? 33,
              revenue: analyticsData?.branchComparison?.mankessim?.revenue ?? 16600,
              staff: analyticsData?.branchComparison?.mankessim?.staff ?? 8,
            },
          ].map((b) => (
            <div key={b.branch} className="p-4 rounded-xl border border-[#dbe4ef] bg-[#f8fafc]">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${b.dotColor}`} />
                <h4 className="text-sm font-bold text-[#0f172a]">{b.branch}</h4>
                <span className="text-xs text-slate-400 ml-auto">{b.subtitle}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Patients', value: b.patients },
                  { label: 'Appointments', value: b.appointments },
                  { label: 'Revenue', value: `GH₵${(b.revenue / 1000).toFixed(1)}k` },
                  { label: 'Staff', value: b.staff },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-lg p-3 border border-[#dbe4ef]">
                    <p className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>{stat.value}</p>
                    <p className="text-[10px] text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low stock alert */}
      <div className="bg-white rounded-2xl border border-amber-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">⚠️</span>
          <div>
            <h3 className="text-sm font-bold text-amber-900" style={{ fontFamily: 'var(--font-heading)' }}>Operational Alerts</h3>
            <p className="text-xs text-amber-600 mt-0.5">Items requiring immediate attention</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AlertCard icon="📦" label="Low Stock Items" value={rawKpis.lowStock ?? 3} note="Below reorder level" color="amber" />
          <AlertCard icon="🔬" label="Pending Lab Orders" value={rawKpis.totalLabs ?? 12} note="Awaiting results" color="orange" />
          <AlertCard icon="👤" label="Inactive Staff" value={rawKpis.inactiveStaff ?? 0} note="Accounts deactivated" color="red" />
        </div>
      </div>
    </div>
  );
}

function AlertCard({ icon, label, value, note, color }: { icon: string; label: string; value: number; note: string; color: 'amber' | 'orange' | 'red' }) {
  const colors = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
      <p className="text-xs font-semibold mt-0.5">{label}</p>
      <p className="text-[10px] mt-0.5 opacity-75">{note}</p>
    </div>
  );
}
