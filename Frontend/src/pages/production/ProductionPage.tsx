import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState } from 'react';
import { useHerbalProduction } from '../../hooks/useHerbalProduction';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';

const stageOrder = ['Mixing', 'Processing', 'QC', 'Packaging', 'Completed'];

export default function ProductionPage() {
  const { batches, createBatch, advanceStage } = useHerbalProduction();
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '', notes: '' });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBatch({
      product: form.product,
      quantity: parseInt(form.quantity) || 0,
      notes: form.notes,
    });
    setSaved(true);
    setTimeout(() => { setShowNew(false); setSaved(false); setForm({ product: '', quantity: '', notes: '' }); }, 1200);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Production Management</h2>
          <p className="text-sm text-slate-400">{batches.length} batches · Mankessim Herbal Centre</p>
        </div>
        <Button onClick={() => setShowNew(true)} size="sm" icon={<PlusIcon />}>New Batch</Button>
      </div>

      {/* Stage summary */}
      <div className="mb-5"><DepartmentGuide department="production" /></div>
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {stageOrder.map((stage) => {
          const count = batches.filter((b) => b.stage === stage).length;
          const colors: Record<string, string> = {
            Mixing: 'bg-sky-50 border-sky-200 text-sky-700',
            Processing: 'bg-amber-50 border-amber-200 text-amber-700',
            QC: 'bg-purple-50 border-purple-200 text-purple-700',
            Packaging: 'bg-blue-50 border-blue-200 text-blue-700',
            Completed: 'bg-green-50 border-green-200 text-green-700',
          };
          return (
            <div key={stage} className={`shrink-0 px-4 py-3 rounded-xl border text-center min-w-[100px] ${colors[stage]}`}>
              <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{count}</p>
              <p className="text-xs font-medium mt-0.5">{stage}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {batches.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-[#dbe4ef] p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[#0f172a]">{b.product}</p>
                  <Badge variant={statusBadge(b.stage)}>{b.stage}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{b.batchNumber} · Started {b.startDate} · Qty: {b.quantity} units</p>
              </div>
              <div className="flex gap-2">
                {b.stage !== 'Completed' && b.stage !== 'Rejected' && (
                  <Button size="sm" variant="secondary" onClick={() => advanceStage(b.id)}>
                    Advance to {stageOrder[Math.min(stageOrder.indexOf(b.stage) + 1, stageOrder.length - 1)]}
                  </Button>
                )}
              </div>
            </div>

            {/* Stage progress bar */}
            <div className="flex items-center gap-1 mb-3">
              {stageOrder.map((stage, i) => {
                const currentIdx = stageOrder.indexOf(b.stage);
                const isPast = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={stage} className="flex items-center flex-1">
                    <div className={`h-1.5 flex-1 rounded-full ${isPast || isCurrent ? 'bg-[#1b4fce]' : 'bg-slate-200'}`} />
                    {i < stageOrder.length - 1 && <div className={`w-2 h-2 rounded-full shrink-0 mx-0.5 ${isPast ? 'bg-[#1b4fce]' : isCurrent ? 'bg-[#1b4fce] ring-2 ring-blue-200' : 'bg-slate-200'}`} />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{b.notes}</p>
              {b.qcApprover && <p className="text-xs text-slate-400">QC: {b.qcApprover}</p>}
              {b.expiryDate && <p className="text-xs text-slate-400">Exp: {b.expiryDate}</p>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Production Batch">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Batch created successfully!</div>}
          <Input label="Product Name *" placeholder="e.g. Neem Leaf Extract 500ml" required value={form.product} onChange={set('product')} />
          <Input label="Planned Quantity (units) *" type="number" required value={form.quantity} onChange={set('quantity')} />
          <Textarea label="Notes" placeholder="Raw materials used, special instructions..." rows={3} value={form.notes} onChange={set('notes')} />
          <div className="flex gap-2">
            <Button type="submit">Create Batch</Button>
            <Button type="button" variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
