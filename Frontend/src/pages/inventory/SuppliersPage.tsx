import { DepartmentGuide } from '../../components/ui/DepartmentGuide';
import { useState } from 'react';
import { Supplier } from '../../types/inventory';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';

const typeColors: Record<Supplier['type'], string> = {
  Drug: 'default', Herbal: 'teal', Consumable: 'info', Equipment: 'warning', 'Raw Material': 'muted',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-sm ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
      ))}
      <span className="text-xs text-slate-400 ml-1">{rating}</span>
    </div>
  );
}

export default function SuppliersPage() {
  const { activeBranch } = useAuth();
  const { suppliers: all, addSupplier } = useSuppliers(activeBranch);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saved, setSaved] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [form, setForm] = useState({
    name: '', contact: '', phone: '', email: '', address: '', type: 'Drug' as Supplier['type'], items: '', paymentTerms: 'Net 30 days', branch: 'Accra',
  });

  const filtered = all.filter((s) => {
    const branchOk = activeBranch === 'All' || s.branch === activeBranch;
    const typeOk = typeFilter === 'All' || s.type === typeFilter;
    return branchOk && typeOk;
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSupplier({
      name: form.name,
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      address: form.address,
      type: form.type,
      items: form.items.split(',').map((s) => s.trim()),
      paymentTerms: form.paymentTerms,
      branch: form.branch,
    });
    setSaved(true);
    setTimeout(() => { setShowAdd(false); setSaved(false); setForm({ name: '', contact: '', phone: '', email: '', address: '', type: 'Drug', items: '', paymentTerms: 'Net 30 days', branch: 'Accra' }); }, 1300);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>Supplier Directory</h2>
          <p className="text-sm text-slate-400">{filtered.filter((s) => s.active).length} active suppliers</p>
        </div>
        <Button onClick={() => setShowAdd(true)} icon={<PlusIcon />} size="sm">Add Supplier</Button>
      </div>

      {/* Type filter */}
      <div className="mb-5"><DepartmentGuide department="suppliers" /></div>
      <div className="flex gap-1 bg-[#f0f4f8] rounded-lg p-0.5 mb-4 w-fit flex-wrap">
        {['All', 'Drug', 'Herbal', 'Consumable', 'Equipment', 'Raw Material'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${typeFilter === t ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'}`}>{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all ${!sup.active ? 'opacity-60' : 'border-[#dbe4ef]'}`}
            onClick={() => { setSelected(sup); setShowDetail(true); }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0f172a] text-sm truncate">{sup.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sup.contact}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <Badge variant={typeColors[sup.type] as 'default'}>{sup.type}</Badge>
                {!sup.active && <Badge variant="muted">Inactive</Badge>}
              </div>
            </div>

            <StarRating rating={sup.rating} />

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>📞</span><span>{sup.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>📍</span><span className="truncate">{sup.address}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>💳</span><span>{sup.paymentTerms}</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#f0f4f8]">
              <p className="text-[10px] text-slate-400 mb-1">Supplies</p>
              <div className="flex flex-wrap gap-1">
                {sup.items.slice(0, 3).map((item) => (
                  <span key={item} className="text-[10px] bg-[#f0f4f8] text-slate-600 px-1.5 py-0.5 rounded">{item}</span>
                ))}
                {sup.items.length > 3 && <span className="text-[10px] text-slate-400">+{sup.items.length - 3} more</span>}
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400">
              Last order: {sup.lastOrder}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="col-span-3 text-center text-slate-400 py-10 text-sm">No suppliers found</p>}
      </div>

      {/* Detail Modal */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title={selected?.name ?? ''} width="max-w-xl">
        {selected && (
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant={typeColors[selected.type] as 'default'} className="mb-2">{selected.type}</Badge>
                <StarRating rating={selected.rating} />
              </div>
              <Badge variant={selected.active ? 'success' : 'muted'}>{selected.active ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Contact Person', value: selected.contact },
                { label: 'Phone', value: selected.phone },
                { label: 'Email', value: selected.email || '—' },
                { label: 'Branch', value: selected.branch },
                { label: 'Payment Terms', value: selected.paymentTerms },
                { label: 'Last Order', value: selected.lastOrder },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-medium text-[#0f172a] mt-0.5">{value}</p>
                </div>
              ))}
              <div className="col-span-2">
                <p className="text-xs text-slate-400">Address</p>
                <p className="font-medium text-[#0f172a] mt-0.5">{selected.address}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Items Supplied</p>
              <div className="flex flex-wrap gap-2">
                {selected.items.map((item) => (
                  <span key={item} className="text-xs bg-[#e8eef7] text-[#1b4fce] px-3 py-1 rounded-full font-medium">{item}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm">Place Order</Button>
              <Button size="sm" variant="secondary">Edit Supplier</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Supplier Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Supplier" width="max-w-xl">
        <form onSubmit={handleAdd} className="p-6 space-y-4">
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">✓ Supplier added!</div>}
          <Input label="Company Name *" required value={form.name} onChange={set('name')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact Person *" required value={form.contact} onChange={set('contact')} />
            <Input label="Phone *" required value={form.phone} onChange={set('phone')} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={set('email')} />
          <Input label="Address" value={form.address} onChange={set('address')} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type *" required value={form.type} onChange={set('type')}>
              {['Drug', 'Herbal', 'Consumable', 'Equipment', 'Raw Material'].map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Select label="Branch" value={form.branch} onChange={set('branch')}>
              <option>Accra</option><option>Mankessim</option>
            </Select>
          </div>
          <Input label="Items Supplied (comma-separated)" placeholder="e.g. Paracetamol, Amoxicillin, Ibuprofen" value={form.items} onChange={set('items')} />
          <Select label="Payment Terms" value={form.paymentTerms} onChange={set('paymentTerms')}>
            {['On delivery', 'Net 15 days', 'Net 30 days', 'Net 60 days', 'Prepayment'].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <div className="flex gap-2">
            <Button type="submit">Add Supplier</Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
