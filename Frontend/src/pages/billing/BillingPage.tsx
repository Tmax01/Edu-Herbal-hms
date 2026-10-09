import { useState } from 'react';
import { Invoice, PaymentMethod } from '../../types/billing';
import { useAuth } from '../../contexts/AuthContext';
import { useBilling } from '../../hooks/useBilling';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select, Input, Textarea } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

export default function BillingPage() {
  const { activeBranch } = useAuth();
  const [filter, setFilter] = useState<'All' | 'Unpaid' | 'Partial' | 'Paid'>('All');
  const { invoices: allInvoices, loading, createInvoice, recordPayment } = useBilling(activeBranch, filter);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  const [newInvForm, setNewInvForm] = useState({ patientName: '', description: '', amount: '', paymentMethod: 'Cash' });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [payAmount, setPayAmount] = useState('');
  const [paid, setPaid] = useState(false);

  const setInv = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setNewInvForm((prev) => ({ ...prev, [f]: e.target.value }));

  const handleNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newInvForm.amount) || 0;
    await createInvoice(
      {
        patientId: 'PAT-NEW',
        patientName: newInvForm.patientName,
        items: [{ description: newInvForm.description || 'Clinical Services', amount: amt }],
      },
      newInvForm.patientName,
      activeBranch
    );
    setInvoiceSaved(true);
    setTimeout(() => { setShowNewInvoice(false); setInvoiceSaved(false); setNewInvForm({ patientName: '', description: '', amount: '', paymentMethod: 'Cash' }); }, 1300);
  };

  const filtered = allInvoices.filter((i) => {
    const branchOk = activeBranch === 'All' || !i.branch || i.branch === activeBranch;
    const statusOk = filter === 'All' || i.status === filter;
    return branchOk && statusOk;
  });

  const totalRevenue = allInvoices.filter((i) => activeBranch === 'All' || !i.branch || i.branch === activeBranch).reduce((s, i) => s + (i.paid || 0), 0);
  const totalOutstanding = allInvoices.filter((i) => activeBranch === 'All' || !i.branch || i.branch === activeBranch).reduce((s, i) => s + (i.total - (i.paid || 0)), 0);

  const handlePayment = async () => {
    if (!selected) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;
    await recordPayment({
      invoiceId: selected.id,
      amountPaid: amount,
      paymentMethod,
    });
    setPaid(true);
    setTimeout(() => { setSelected(null); setPaid(false); setPayAmount(''); }, 1500);
  };


  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Billing & Accounts</h2>
          <p className="text-sm text-slate-400">{filtered.length} invoices · {activeBranch === 'All' ? 'All branches' : activeBranch}</p>
        </div>
        <Button size="sm" icon={<PlusIcon />} onClick={() => setShowNewInvoice(true)}>New Invoice</Button>
      </div>

      <div className="mb-5">
        <DepartmentGuide department="billing" />
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-[#dbe4ef] p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1" style={{ fontFamily: 'var(--font-heading)' }}>GHS {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#dbe4ef] p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold text-red-500 mt-1" style={{ fontFamily: 'var(--font-heading)' }}>GHS {totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#dbe4ef] p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Total Billed</p>
          <p className="text-2xl font-bold text-[#0f172a] mt-1" style={{ fontFamily: 'var(--font-heading)' }}>GHS {(totalRevenue + totalOutstanding).toLocaleString()}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-[#f0f4f8] rounded-lg p-0.5 mb-4 w-fit">
        {(['All', 'Unpaid', 'Partial', 'Paid'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}>{f}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f8]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f8]">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-[#f8fafc] transition-colors">
                <td className="px-5 py-3">
                  <span className="font-mono text-xs text-slate-600">{inv.id}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[#0f172a]">{inv.patientName}</p>
                  <p className="text-xs text-slate-400">{inv.branch}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">{inv.visitDate}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-semibold text-[#0f172a]">GHS {inv.total.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-semibold ${inv.total - inv.paid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    GHS {(inv.total - inv.paid).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge(inv.status)}>{inv.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setViewInvoice(inv)} className="text-xs text-[#1b4fce] hover:underline">View</button>
                    {inv.status !== 'Paid' && (
                      <button onClick={() => { setSelected(inv); setPayAmount(''); setPaid(false); }} className="text-xs text-green-600 hover:underline font-medium">Pay</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-400 py-12 text-sm">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Invoice modal */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Invoice ${viewInvoice?.id ?? ''}`} width="max-w-lg">
        {viewInvoice && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Patient', value: viewInvoice.patientName },
                { label: 'Visit Date', value: viewInvoice.visitDate },
                { label: 'Branch', value: viewInvoice.branch },
                { label: 'Payment Method', value: viewInvoice.paymentMethod ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-[#f8fafc] rounded-lg border border-[#dbe4ef]">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-[#0f172a] mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-[#dbe4ef] rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-[#f8fafc] border-b border-[#dbe4ef]">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Line Items</p>
              </div>
              <div className="divide-y divide-[#f0f4f8]">
                {viewInvoice.lineItems.map((li, i) => (
                  <div key={i} className="flex justify-between px-4 py-3 text-sm">
                    <span className="text-slate-700">{li.description}</span>
                    <span className="font-semibold text-[#0f172a]">GHS {li.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#dbe4ef] flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>GHS {viewInvoice.total.toLocaleString()}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span className="text-slate-500">Paid</span>
                <span className="text-green-600 font-semibold">GHS {viewInvoice.paid.toLocaleString()}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm border-t border-[#f0f4f8]">
                <span className="font-semibold">Balance Due</span>
                <span className={`font-bold ${viewInvoice.total - viewInvoice.paid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  GHS {(viewInvoice.total - viewInvoice.paid).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={statusBadge(viewInvoice.status)}>{viewInvoice.status}</Badge>
              {viewInvoice.status !== 'Paid' && (
                <Button size="sm" onClick={() => { setSelected(viewInvoice); setViewInvoice(null); setPayAmount(''); setPaid(false); }}>Record Payment</Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => {
                const lines = viewInvoice.lineItems.map((li) => `  ${li.description}: GHS ${li.amount}`).join('\n');
                const text = `INVOICE ${viewInvoice.id}\nPatient: ${viewInvoice.patientName}\nDate: ${viewInvoice.visitDate}\n\n${lines}\n\nTotal: GHS ${viewInvoice.total}\nPaid: GHS ${viewInvoice.paid}\nBalance: GHS ${viewInvoice.total - viewInvoice.paid}\nStatus: ${viewInvoice.status}`;
                const blob = new Blob([text], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `${viewInvoice.id}.txt`;
                a.click();
              }}>Download</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Invoice modal */}
      <Modal open={showNewInvoice} onClose={() => setShowNewInvoice(false)} title="Create New Invoice">
        <form onSubmit={handleNewInvoice} className="p-6 space-y-4">
          {invoiceSaved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Invoice created successfully!</div>}
          <Input label="Patient Name *" placeholder="Full name of patient" required value={newInvForm.patientName} onChange={setInv('patientName')} />
          <Textarea label="Services / Description" placeholder="e.g. Consultation, Lab tests, Medication..." rows={3} value={newInvForm.description} onChange={setInv('description')} />
          <Input label="Total Amount (GHS) *" type="number" placeholder="0.00" required value={newInvForm.amount} onChange={setInv('amount')} />
          <Select label="Payment Method" value={newInvForm.paymentMethod} onChange={setInv('paymentMethod')}>
            <option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>POS / Card</option><option>NHIS</option>
          </Select>
          <div className="flex gap-2">
            <Button type="submit">Create Invoice</Button>
            <Button type="button" variant="secondary" onClick={() => setShowNewInvoice(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Payment modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Record Payment">
        <div className="p-6 space-y-4">
          {paid && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Payment recorded successfully!</div>}
          {selected && !paid && (
            <>
              <div className="p-4 bg-[#f8fafc] rounded-xl">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-500">Invoice</span>
                  <span className="text-sm font-mono font-medium">{selected.id}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-500">Patient</span>
                  <span className="text-sm font-medium">{selected.patientName}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-500">Total</span>
                  <span className="text-sm font-bold">GHS {selected.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-[#dbe4ef] pt-2 mt-2">
                  <span className="text-sm text-slate-500">Balance Due</span>
                  <span className="text-sm font-bold text-red-600">GHS {(selected.total - selected.paid).toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                {selected.lineItems.map((li, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-600">{li.description}</span>
                    <span className="font-medium">GHS {li.amount}</span>
                  </div>
                ))}
              </div>

              <Select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <option>Cash</option>
                <option>Mobile Money</option>
                <option>Bank Transfer</option>
                <option>POS / Card</option>
                <option>NHIS</option>
              </Select>
              <Input
                label="Amount to Pay (GHS)"
                type="number"
                placeholder={`Max: ${(selected.total - selected.paid)}`}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handlePayment} variant="teal">Record Payment</Button>
                <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
