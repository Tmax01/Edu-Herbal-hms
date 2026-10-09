import { useState } from 'react';
import { ExpenseCategory } from '../../types/accounting';
import { useAuth } from '../../contexts/AuthContext';
import { useAccounting } from '../../hooks/useAccounting';
import { useBilling } from '../../hooks/useBilling';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

type AccountTab = 'overview' | 'expenses' | 'payroll' | 'plstatement';

const categoryColors: Record<string, string> = {
  Salaries: 'bg-purple-100 text-purple-700',
  Supplies: 'bg-blue-100 text-blue-700',
  Utilities: 'bg-amber-100 text-amber-700',
  Maintenance: 'bg-orange-100 text-orange-700',
  Equipment: 'bg-sky-100 text-sky-700',
  Other: 'bg-slate-100 text-slate-600',
};

export default function AccountingPage() {
  const { activeBranch, user } = useAuth();
  const [tab, setTab] = useState<AccountTab>('overview');
  const { expenses: allExpenses, payroll, loading, addExpense, updatePayrollStatus } = useAccounting(activeBranch);
  const { invoices } = useBilling(activeBranch);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expSaved, setExpSaved] = useState(false);
  const [expForm, setExpForm] = useState({ description: '', category: 'Supplies' as ExpenseCategory, amount: '', paymentMethod: 'Bank Transfer', branch: 'Accra' });

  const branchExpenses = allExpenses.filter((e) => activeBranch === 'All' || !e.branch || e.branch === activeBranch || e.branch === 'All');
  const branchInvoices = invoices.filter((i) => activeBranch === 'All' || !i.branch || i.branch === activeBranch);
  const branchPayroll = payroll.filter((p) => activeBranch === 'All' || !p.branch || p.branch === activeBranch || p.branch === 'All');

  const totalRevenue = branchInvoices.reduce((s, i) => s + i.paid, 0);
  const totalExpenses = branchExpenses.reduce((s, e) => s + e.amount, 0);
  const salaryExpenses = branchPayroll.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.netSalary, 0);
  const netProfit = totalRevenue - totalExpenses - salaryExpenses;
  const collectionRate = branchInvoices.length > 0 ? Math.round((branchInvoices.reduce((s, i) => s + i.paid, 0) / branchInvoices.reduce((s, i) => s + i.total, 0)) * 100) : 0;

  const setExp = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setExpForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense({
      description: expForm.description,
      category: expForm.category,
      amount: parseFloat(expForm.amount),
      paymentMethod: expForm.paymentMethod,
      branch: expForm.branch,
    }, user?.name || 'Efua Asiedu');
    setExpSaved(true);
    setTimeout(() => { setShowAddExpense(false); setExpSaved(false); setExpForm({ description: '', category: 'Supplies', amount: '', paymentMethod: 'Bank Transfer', branch: 'Accra' }); }, 1200);
  };


  const tabs: { id: AccountTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'payroll', label: 'Payroll', icon: '💰' },
    { id: 'plstatement', label: 'P&L Statement', icon: '📋' },
  ];

  const expenseByCategory = Object.entries(
    branchExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Accounting & Finance</h2>
          <p className="text-sm text-slate-400">{activeBranch === 'All' ? 'All branches' : activeBranch} · August 2026</p>
        </div>
        <div className="flex gap-2">
          {tab === 'expenses' && <Button size="sm" onClick={() => setShowAddExpense(true)} icon={<PlusIcon />}>Log Expense</Button>}
          <Button size="sm" variant="secondary" onClick={() => {
            const lines = [
              `EDHEC HMS — Accounting Report`,
              `Branch: ${activeBranch === 'All' ? 'All Branches' : activeBranch} · August 2026`,
              `Generated: ${new Date().toLocaleString()}`,
              ``,
              `REVENUE`,
              `  Total Revenue Collected: GHS ${totalRevenue.toLocaleString()}`,
              `  Collection Rate: ${collectionRate}%`,
              ``,
              `EXPENSES`,
              `  Total Expenses: GHS ${totalExpenses.toLocaleString()}`,
              `  Payroll (Paid): GHS ${salaryExpenses.toLocaleString()}`,
              ``,
              `PROFIT / LOSS`,
              `  Net Profit: GHS ${netProfit.toLocaleString()}`,
            ];
            const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Accounting_Report_${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
          }}>Export PDF</Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-5"><DepartmentGuide department="accounting" /></div>
      <div className="flex gap-1 bg-[#f0f4f8] rounded-xl p-1 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Total Revenue" value={`GHS ${totalRevenue.toLocaleString()}`} sub="Collected this month" trend="+12%" up icon="💵" color="bg-green-50 border-green-200" />
            <KPICard label="Total Expenses" value={`GHS ${totalExpenses.toLocaleString()}`} sub="Operational costs" trend="+5%" up={false} icon="💸" color="bg-red-50 border-red-200" />
            <KPICard label="Salary Costs" value={`GHS ${salaryExpenses.toLocaleString()}`} sub={`${branchPayroll.filter((p) => p.status === 'Paid').length} staff paid`} icon="👥" color="bg-purple-50 border-purple-200" />
            <KPICard label="Net Profit" value={`GHS ${Math.abs(netProfit).toLocaleString()}`} sub={netProfit >= 0 ? 'Profit this month' : 'Net loss this month'} icon={netProfit >= 0 ? '📈' : '📉'} color={netProfit >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
              <h3 className="font-semibold text-sm text-[#0f172a] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Revenue vs Expenses</h3>
              <div className="space-y-3">
                {[
                  { label: 'Revenue Collected', value: totalRevenue, max: totalRevenue + totalExpenses, color: 'bg-green-500' },
                  { label: 'Operational Expenses', value: totalExpenses, max: totalRevenue + totalExpenses, color: 'bg-red-400' },
                  { label: 'Salary Costs', value: salaryExpenses, max: totalRevenue + totalExpenses, color: 'bg-purple-400' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-semibold text-[#0f172a]">GHS {item.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#f0f4f8] flex justify-between items-center">
                <span className="text-sm text-slate-500">Collection Rate</span>
                <span className={`text-sm font-bold ${collectionRate >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{collectionRate}%</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
              <h3 className="font-semibold text-sm text-[#0f172a] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Expenses by Category</h3>
              <div className="space-y-2">
                {expenseByCategory.map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColors[cat] ?? 'bg-slate-100 text-slate-600'} w-24 shrink-0 text-center`}>{cat}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1b4fce] rounded-full" style={{ width: `${Math.min(100, (amt / (totalExpenses || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-[#0f172a] w-24 text-right">GHS {amt.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Outstanding invoices */}
          <div className="bg-white rounded-xl border border-[#dbe4ef] p-5">
            <h3 className="font-semibold text-sm text-[#0f172a] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Outstanding Receivables</h3>
            <div className="space-y-2">
              {branchInvoices.filter((i) => i.status !== 'Paid').map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">{inv.patientName}</p>
                    <p className="text-xs text-slate-400">{inv.id} · {inv.visitDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">GHS {(inv.total - inv.paid).toLocaleString()}</p>
                    <Badge variant={statusBadge(inv.status)} className="mt-0.5">{inv.status}</Badge>
                  </div>
                </div>
              ))}
              {branchInvoices.filter((i) => i.status !== 'Paid').length === 0 && (
                <p className="text-sm text-green-600 font-medium text-center py-3">✓ No outstanding receivables</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {tab === 'expenses' && (
        <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f0f4f8] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0f172a]">Expense Log — {activeBranch === 'All' ? 'All Branches' : activeBranch}</p>
            <p className="text-sm font-bold text-red-600">Total: GHS {totalExpenses.toLocaleString()}</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f4f8]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Branch</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {branchExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-[#0f172a]">{exp.description}</p>
                    <p className="text-xs text-slate-400">{exp.paymentMethod} · Approved by {exp.approvedBy}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColors[exp.category]}`}>{exp.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{exp.date}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">{exp.branch}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-red-600">GHS {exp.amount.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {branchExpenses.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No expenses recorded</td></tr>}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#dbe4ef] bg-[#f8fafc]">
                <td colSpan={4} className="px-5 py-3 text-sm font-bold text-[#0f172a]">Total Expenses</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-red-600">GHS {totalExpenses.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* PAYROLL TAB */}
      {tab === 'payroll' && (
        <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f0f4f8] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#0f172a]">Payroll — August 2026</p>
            <div className="flex gap-3 text-xs">
              <span className="text-green-600 font-medium">{branchPayroll.filter((p) => p.status === 'Paid').length} Paid</span>
              <span className="text-amber-600 font-medium">{branchPayroll.filter((p) => p.status === 'Pending').length} Pending</span>
              <span className="text-red-600 font-medium">{branchPayroll.filter((p) => p.status === 'On Hold').length} On Hold</span>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f4f8]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Basic</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Allowances</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Deductions</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Net Pay</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f8]">
              {branchPayroll.map((p) => (
                <tr key={p.staffId} className="hover:bg-[#f8fafc]">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-[#0f172a]">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.role.replace('_', ' ')} · {p.branch}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm hidden md:table-cell">GHS {p.basicSalary.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-xs text-green-600 hidden lg:table-cell">+{p.allowances}</td>
                  <td className="px-4 py-3 text-right text-xs text-red-500 hidden lg:table-cell">-{p.deductions}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-[#0f172a]">GHS {p.netSalary.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === 'Paid' ? 'success' : p.status === 'Pending' ? 'warning' : 'danger'}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[#dbe4ef] bg-[#f8fafc]">
                <td className="px-5 py-3 text-sm font-bold text-[#0f172a]">Total Payroll</td>
                <td colSpan={3} className="hidden lg:table-cell" />
                <td className="px-4 py-3 text-right text-sm font-bold text-[#0f172a]">GHS {branchPayroll.reduce((s, p) => s + p.netSalary, 0).toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* P&L STATEMENT */}
      {tab === 'plstatement' && (
        <div className="bg-white rounded-xl border border-[#dbe4ef] p-6 max-w-2xl">
          <div className="text-center mb-6 pb-4 border-b border-[#f0f4f8]">
            <p className="font-bold text-lg text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>EduHMS — Profit & Loss Statement</p>
            <p className="text-sm text-slate-400 mt-1">August 2026 · {activeBranch === 'All' ? 'All Branches' : activeBranch}</p>
          </div>

          <PLRow label="REVENUE" bold />
          <PLRow label="Patient Revenue (Consultations)" amount={branchInvoices.filter((i) => i.lineItems.some((l: any) => l.description.includes('Consultation'))).reduce((s, i) => s + i.lineItems.filter((l: any) => l.description.includes('Consultation')).reduce((ss: any, l: any) => ss + l.amount, 0), 0)} />
          <PLRow label="Pharmacy Revenue" amount={branchInvoices.reduce((s, i) => s + i.lineItems.filter((l: any) => !l.description.includes('Consultation') && !l.description.includes('Admission') && !['CBC', 'HbA1c', 'ECG', 'Full Blood', 'Renal', 'Fasting', 'Lipid', 'Malaria', 'Troponin', 'BNP'].some((t) => l.description.includes(t))).reduce((ss: any, l: any) => ss + l.amount, 0), 0)} />
          <PLRow label="Lab Revenue" amount={branchInvoices.reduce((s, i) => s + i.lineItems.filter((l: any) => ['Full Blood', 'HbA1c', 'Fasting', 'Lipid', 'ECG', 'Malaria', 'Renal'].some((t) => l.description.includes(t))).reduce((ss: any, l: any) => ss + l.amount, 0), 0)} />
          <PLRow label="Ward & Admission Revenue" amount={630} />
          <PLRow label="Total Revenue" amount={branchInvoices.reduce((s, i) => s + i.total, 0)} bold border />

          <PLRow label="EXPENSES" bold className="mt-4" />
          <PLRow label="Pharmaceutical Supplies" amount={branchExpenses.filter((e) => e.category === 'Supplies').reduce((s, e) => s + e.amount, 0)} negative />
          <PLRow label="Utilities" amount={branchExpenses.filter((e) => e.category === 'Utilities').reduce((s, e) => s + e.amount, 0)} negative />
          <PLRow label="Maintenance" amount={branchExpenses.filter((e) => e.category === 'Maintenance').reduce((s, e) => s + e.amount, 0)} negative />
          <PLRow label="Other Expenses" amount={branchExpenses.filter((e) => e.category === 'Other').reduce((s, e) => s + e.amount, 0)} negative />
          <PLRow label="Total Expenses" amount={totalExpenses} bold negative border />

          <PLRow label="STAFF COSTS" bold className="mt-4" />
          <PLRow label="Total Payroll (paid)" amount={salaryExpenses} negative border />

          <div className={`mt-4 p-4 rounded-xl ${netProfit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex justify-between items-center">
              <p className={`font-bold text-base ${netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`} style={{ fontFamily: 'var(--font-heading)' }}>NET {netProfit >= 0 ? 'PROFIT' : 'LOSS'}</p>
              <p className={`font-bold text-xl ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} style={{ fontFamily: 'var(--font-heading)' }}>GHS {Math.abs(netProfit).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Log Expense">
        <form onSubmit={handleAddExpense} className="p-6 space-y-4">
          {expSaved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Expense logged successfully!</div>}
          <Input label="Description *" placeholder="e.g. August Drug Procurement" required value={expForm.description} onChange={setExp('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category *" required value={expForm.category} onChange={setExp('category')}>
              {['Salaries', 'Supplies', 'Utilities', 'Maintenance', 'Equipment', 'Other'].map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Amount (GHS) *" type="number" required value={expForm.amount} onChange={setExp('amount')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Payment Method" value={expForm.paymentMethod} onChange={setExp('paymentMethod')}>
              {['Bank Transfer', 'Mobile Money', 'Cash', 'POS', 'Cheque'].map((m) => <option key={m}>{m}</option>)}
            </Select>
            <Select label="Branch" value={expForm.branch} onChange={setExp('branch')}>
              <option>Accra</option><option>Mankessim</option><option value="All">Both</option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Log Expense</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAddExpense(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function KPICard({ label, value, sub, trend, up, icon, color }: { label: string; value: string; sub?: string; trend?: string; up?: boolean; icon: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-current opacity-70">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xl font-bold text-current" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
      {sub && <p className="text-xs text-current opacity-60 mt-0.5">{sub}</p>}
      {trend && <p className={`text-xs mt-1 font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>{up ? '↑' : '↓'} {trend}</p>}
    </div>
  );
}

function PLRow({ label, amount, bold, negative, border, className }: { label: string; amount?: number; bold?: boolean; negative?: boolean; border?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between py-2 ${border ? 'border-t border-[#dbe4ef] font-semibold' : ''} ${className ?? ''}`}>
      <span className={`text-sm ${bold ? 'font-bold text-[#0f172a]' : 'text-slate-600'}`}>{label}</span>
      {amount !== undefined && (
        <span className={`text-sm font-semibold ${negative ? 'text-red-600' : 'text-[#0f172a]'}`}>
          {negative ? '- ' : ''}GHS {amount.toLocaleString()}
        </span>
      )}
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
