import { useState, useEffect, useCallback } from 'react';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useAuth } from '../../contexts/AuthContext';
import { reportsService } from '../../services/reportsService';

export default function ReportsPage() {
  const { activeBranch } = useAuth();
  const [reportType, setReportType] = useState<'revenue' | 'patients' | 'appointments' | 'inventory'>('revenue');
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-31');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const data = await reportsService.getReport({
      reportType,
      type: reportType,
      startDate: dateFrom,
      endDate: dateTo,
      branch: activeBranch,
    });
    setReportData(data);
    setLoading(false);
  }, [reportType, dateFrom, dateTo, activeBranch]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res = await reportsService.exportPdf({
        reportType,
        type: reportType,
        startDate: dateFrom,
        endDate: dateTo,
        branch: activeBranch,
      });
      if (res) {
        setExportNotice(`Export generated successfully! Document ID: ${res.exportId || 'PDF-' + Date.now()}`);
        setTimeout(() => setExportNotice(null), 5000);
      } else {
        setExportNotice('Export requested. Print document preview is ready.');
        setTimeout(() => setExportNotice(null), 4000);
      }
    } catch {
      setExportNotice('Failed to generate PDF export.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setExporting(false);
    }
  };

  const reportTypes = [
    { id: 'revenue', label: 'Revenue Report', icon: '💰' },
    { id: 'patients', label: 'Patient Statistics', icon: '👥' },
    { id: 'appointments', label: 'Appointment Summary', icon: '📅' },
    { id: 'inventory', label: 'Inventory Report', icon: '📦' },
  ] as const;

  // Extract metrics based on report response
  const revSummary = reportData?.summary || {};
  const invoicesList: any[] = reportData?.invoices || [];
  const patientList: any[] = reportData?.patients || [];
  const apptSummary = reportData?.summary || {};
  const providerList: any[] = reportData?.byProvider || [];
  const apptList: any[] = reportData?.appointments || [];
  const stockItems: any[] = reportData?.items || [];
  const invSummary = reportData?.summary || {};

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Reports & Analytics</h2>
          <p className="text-sm text-slate-400">
            {activeBranch === 'All' ? 'Consolidated (All Branches)' : `${activeBranch} Branch`} · Live Database
          </p>
        </div>
        <div className="flex items-center gap-3">
          {exportNotice && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in font-medium">
              ✓ {exportNotice}
            </span>
          )}
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1b4fce] rounded-lg hover:bg-[#1640b0] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>📄</span> Export PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-5"><DepartmentGuide department="reports" /></div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Report type selector */}
        <div className="bg-white rounded-xl border border-[#dbe4ef] p-4 h-fit">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Report Type</p>
          <div className="space-y-1">
            {reportTypes.map((r) => (
              <button
                key={r.id}
                onClick={() => setReportType(r.id)}
                className={`w-full text-left flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  reportType === r.id
                    ? 'bg-blue-50 border border-blue-200 text-[#1b4fce] font-semibold'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span>{r.icon}</span>
                <span className="text-sm">{r.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3 pt-4 border-t border-[#f0f4f8]">
            <div>
              <p className="text-xs text-slate-500 mb-1">From</p>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">To</p>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
              />
            </div>
          </div>
        </div>

        {/* Report content */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl border border-[#dbe4ef] p-12 text-center text-slate-400">
              <div className="inline-block w-8 h-8 border-3 border-[#1b4fce] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-600">Generating live report for {reportType}...</p>
              <p className="text-xs text-slate-400 mt-1">Aggregating records from {dateFrom} to {dateTo}</p>
            </div>
          ) : (
            <>
              {/* REVENUE REPORT */}
              {reportType === 'revenue' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <MetricCard
                      label="Total Billed"
                      value={`GH₵ ${(revSummary.totalBilled ?? 0).toLocaleString()}`}
                      color="bg-blue-50 text-blue-700"
                    />
                    <MetricCard
                      label="Collected"
                      value={`GH₵ ${(revSummary.totalCollected ?? 0).toLocaleString()}`}
                      color="bg-green-50 text-green-700"
                    />
                    <MetricCard
                      label="Outstanding"
                      value={`GH₵ ${(revSummary.totalOutstanding ?? 0).toLocaleString()}`}
                      color="bg-red-50 text-red-700"
                    />
                  </div>
                  <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-[#0f172a] text-sm">Revenue Breakdown by Invoice</h3>
                      <span className="text-xs text-slate-400">{invoicesList.length} Invoices</span>
                    </div>
                    {invoicesList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No invoices recorded in this period.</p>
                    ) : (
                      <div className="space-y-3">
                        {invoicesList.map((inv) => (
                          <div key={inv.id} className="flex items-center gap-3">
                            <div className="w-32 shrink-0">
                              <span className="font-mono text-xs text-slate-600 block">{inv.patientName || 'Patient'}</span>
                              <span className="font-mono text-[10px] text-slate-400 block truncate">{inv.id}</span>
                            </div>
                            <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#1b4fce] rounded-full transition-all"
                                style={{ width: `${Math.min(100, inv.percentage || (inv.total > 0 ? (inv.paid / inv.total) * 100 : 0))}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[#0f172a] w-28 text-right">
                              GH₵ {(inv.paid || 0).toLocaleString()} / {(inv.total || 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* PATIENTS REPORT */}
              {reportType === 'patients' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <MetricCard label="Total Patients" value={reportData?.summary?.totalPatients ?? patientList.length} color="bg-blue-50 text-blue-700" />
                    <MetricCard label="New in Period" value={reportData?.summary?.registeredThisMonth ?? patientList.length} color="bg-teal-50 text-teal-700" />
                    <MetricCard label="Female" value={reportData?.summary?.femalePatients ?? patientList.filter((p) => p.gender?.toLowerCase() === 'female').length} color="bg-pink-50 text-pink-700" />
                    <MetricCard label="Male" value={reportData?.summary?.malePatients ?? patientList.filter((p) => p.gender?.toLowerCase() === 'male').length} color="bg-sky-50 text-sky-700" />
                  </div>
                  <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-[#0f172a] text-sm">Patient Roster</h3>
                      <span className="text-xs text-slate-400">{patientList.length} Registered</span>
                    </div>
                    {patientList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No patients registered in selected range.</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {patientList.map((p) => (
                          <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#f0f4f8] last:border-0">
                            <div>
                              <p className="text-sm font-medium text-[#0f172a]">{p.name || p.fullName}</p>
                              <p className="text-xs text-slate-400">{p.mrn} · {p.gender} · {p.branch || activeBranch}</p>
                            </div>
                            <p className="text-xs text-slate-500 font-mono">Reg: {p.registeredDate}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* APPOINTMENTS REPORT */}
              {reportType === 'appointments' && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <MetricCard label="Scheduled" value={apptSummary.scheduled ?? 0} color="bg-blue-50 text-blue-700" />
                    <MetricCard label="Checked-in" value={apptSummary.checkedIn ?? 0} color="bg-teal-50 text-teal-700" />
                    <MetricCard label="Completed" value={apptSummary.completed ?? 0} color="bg-emerald-50 text-emerald-700" />
                    <MetricCard label="No-show" value={apptSummary.noShow ?? 0} color="bg-rose-50 text-rose-700" />
                  </div>
                  <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
                    <h3 className="font-semibold text-[#0f172a] mb-4 text-sm">Appointments by Provider</h3>
                    {providerList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No provider appointments recorded.</p>
                    ) : (
                      providerList.map((doc) => (
                        <div key={doc.doctorName} className="flex items-center gap-3 mb-2.5">
                          <span className="text-xs text-slate-600 w-44 shrink-0 truncate font-medium">{doc.doctorName}</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0d9488] rounded-full" style={{ width: `${doc.percentage || 10}%` }} />
                          </div>
                          <span className="text-xs font-bold text-[#0f172a] w-8 text-right">{doc.count}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {apptList.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
                      <h3 className="font-semibold text-[#0f172a] mb-3 text-sm">Appointment Records</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {apptList.map((a) => (
                          <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#f0f4f8] text-xs">
                            <div>
                              <p className="font-medium text-[#0f172a]">{a.patientName} <span className="text-slate-400">({a.mrn})</span></p>
                              <p className="text-slate-500">{a.doctorName} · {a.department}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-slate-500">{a.date} {a.time}</span>
                              <span className="block capitalize font-semibold text-slate-700 mt-0.5">{a.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* INVENTORY REPORT */}
              {reportType === 'inventory' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <MetricCard label="Total Stock Items" value={invSummary.totalItems ?? stockItems.length} color="bg-blue-50 text-blue-700" />
                    <MetricCard label="Low Stock Items" value={invSummary.lowStockItems ?? stockItems.filter((s) => s.isLow || s.quantity <= s.reorderLevel).length} color="bg-amber-50 text-amber-700" />
                    <MetricCard label="Healthy Stock" value={invSummary.okItems ?? stockItems.filter((s) => !s.isLow && s.quantity > s.reorderLevel).length} color="bg-emerald-50 text-emerald-700" />
                  </div>
                  <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#f0f4f8] flex items-center justify-between">
                      <h3 className="font-semibold text-[#0f172a] text-sm">Stock Status Report</h3>
                      <span className="text-xs text-slate-400">{stockItems.length} Catalog Items</span>
                    </div>
                    {stockItems.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">No inventory items found.</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#f0f4f8]">
                            <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f4f8]">
                          {stockItems.map((s) => {
                            const isLow = s.isLow || s.quantity <= s.reorderLevel;
                            return (
                              <tr key={s.id} className={isLow ? 'bg-red-50/30' : ''}>
                                <td className="px-5 py-2 text-sm text-[#0f172a] font-medium">{s.name}</td>
                                <td className="px-4 py-2 text-xs text-slate-500">{s.branch}</td>
                                <td className="px-4 py-2 text-sm font-semibold">{s.quantity} {s.unit}</td>
                                <td className="px-4 py-2">
                                  {isLow ? (
                                    <span className="text-xs text-red-600 font-semibold bg-red-100/60 px-2 py-0.5 rounded-full">⚠️ Low</span>
                                  ) : (
                                    <span className="text-xs text-emerald-600 font-medium bg-emerald-100/60 px-2 py-0.5 rounded-full">✓ OK</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color} border-current border-opacity-20`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
    </div>
  );
}
