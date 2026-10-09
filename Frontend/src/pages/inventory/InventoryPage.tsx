import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePharmacy } from '../../hooks/usePharmacy';
import { stockService } from '../../services/stockService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { DepartmentGuide } from '../../components/ui/DepartmentGuide';

export default function InventoryPage() {
  const { activeBranch } = useAuth();
  const { stockItems, loading, refresh } = usePharmacy(activeBranch);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  
  // Transfer Modal State
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferred, setTransferred] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferForm, setTransferForm] = useState({ item: '', quantity: '', destination: 'Accra' });

  // Add Stock Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [stockAdded, setStockAdded] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<{
    name: string;
    category: string;
    quantity: string;
    unit: string;
    reorderLevel: string;
    supplier: string;
    branch: string;
  }>({
    name: '',
    category: 'Drug',
    quantity: '100',
    unit: 'Boxes',
    reorderLevel: '20',
    supplier: 'EduCare Pharmaceuticals',
    branch: activeBranch === 'All' ? 'Accra' : activeBranch,
  });

  const filtered = stockItems.filter((s) => {
    const branchOk = activeBranch === 'All' || s.branch === activeBranch;
    const catOk = category === 'All' || s.category === category;
    const searchOk = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return branchOk && catOk && searchOk;
  });

  const lowCount = filtered.filter((s) => s.quantity <= s.reorderLevel).length;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    setTransferError(null);
    try {
      await stockService.transferStock({
        stockItemId: transferForm.item,
        quantity: Number(transferForm.quantity),
        destinationBranch: transferForm.destination,
      });
      setTransferred(true);
      if (refresh) await refresh();
      setTimeout(() => {
        setShowTransfer(false);
        setTransferred(false);
        setTransferForm({ item: '', quantity: '', destination: 'Accra' });
      }, 1500);
    } catch (err: any) {
      setTransferError(err?.message || 'Failed to dispatch stock transfer');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      await stockService.createItem({
        name: addForm.name,
        category: addForm.category,
        unit: addForm.unit,
        reorderLevel: Number(addForm.reorderLevel),
        branch: addForm.branch,
      });
      setStockAdded(true);
      if (refresh) await refresh();
      setTimeout(() => {
        setShowAdd(false);
        setStockAdded(false);
        setAddForm({
          name: '',
          category: 'Drug',
          quantity: '100',
          unit: 'Boxes',
          reorderLevel: '20',
          supplier: 'EduCare Pharmaceuticals',
          branch: activeBranch === 'All' ? 'Accra' : activeBranch,
        });
      }, 1500);
    } catch (err: any) {
      setAddError(err?.message || 'Failed to add stock item');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>
            Inventory & Stores
          </h2>
          <p className="text-sm text-slate-400">
            {filtered.length} items · {lowCount > 0 ? <span className="text-red-500 font-medium">{lowCount} low stock</span> : 'All stock OK'} · {activeBranch === 'All' ? 'All Branches' : `${activeBranch} Branch`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowTransfer(true)}>
            Stock Transfer
          </Button>
          <Button size="sm" icon={<PlusIcon />} onClick={() => setShowAdd(true)}>
            Add Stock
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5"><DepartmentGuide department="inventory" /></div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-[#dbe4ef] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
          />
        </div>
        <div className="flex bg-[#f0f4f8] rounded-lg p-0.5">
          {['All', 'Drug', 'Herbal', 'Raw Material', 'Consumable'].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                category === c ? 'bg-white text-[#1b4fce] shadow-sm' : 'text-slate-500'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#dbe4ef] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f4f8]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock Level</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Batch / Expiry</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f8]">
            {filtered.map((s) => {
              const isLow = s.quantity <= s.reorderLevel;
              const pct = Math.min(100, Math.round((s.quantity / Math.max(1, s.reorderLevel * 2)) * 100));
              return (
                <tr key={s.id} className={`hover:bg-[#f8fafc] transition-colors ${isLow ? 'bg-red-50/20' : ''}`}>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-[#0f172a]">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.supplier}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={s.category === 'Herbal' ? 'teal' : s.category === 'Drug' ? 'default' : s.category === 'Raw Material' ? 'warning' : 'muted'}>
                      {s.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-600">{s.branch}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-[#0f172a]'}`}>
                        {s.quantity} {s.unit}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reorder: {s.reorderLevel} {s.unit}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs font-mono text-slate-600">{s.batchNo}</p>
                    <p className="text-xs text-slate-400">Exp: {s.expiryDate}</p>
                  </td>
                  <td className="px-4 py-3">
                    {isLow ? <Badge variant="danger">Low Stock</Badge> : <Badge variant="success">OK</Badge>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                  {loading ? 'Loading catalog items…' : 'No items found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Transfer Modal */}
      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title="Stock Transfer between Branches">
        <form onSubmit={handleTransfer} className="p-6 space-y-4">
          {transferred && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              ✓ Transfer successfully dispatched via Backend Stock Engine!
            </div>
          )}
          {transferError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              ✕ {transferError}
            </div>
          )}
          <Select
            label="Item to Transfer *"
            required
            value={transferForm.item}
            onChange={(e) => setTransferForm((f) => ({ ...f, item: e.target.value }))}
          >
            <option value="">Select item...</option>
            {stockItems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.quantity} {s.unit} at {s.branch})
              </option>
            ))}
          </Select>
          <Input
            label="Quantity to Transfer *"
            type="number"
            min="1"
            required
            value={transferForm.quantity}
            onChange={(e) => setTransferForm((f) => ({ ...f, quantity: e.target.value }))}
          />
          <Select
            label="Destination Branch *"
            required
            value={transferForm.destination}
            onChange={(e) => setTransferForm((f) => ({ ...f, destination: e.target.value }))}
          >
            <option value="Accra">Accra Main Hospital</option>
            <option value="Mankessim">Mankessim Herbal Centre</option>
          </Select>
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="teal" disabled={transferLoading}>
              {transferLoading ? 'Dispatching...' : 'Dispatch Transfer'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowTransfer(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Stock Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Stock Catalog Item">
        <form onSubmit={handleAddStock} className="p-6 space-y-4">
          {stockAdded && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
              ✓ Stock catalog item registered successfully!
            </div>
          )}
          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              ✕ {addError}
            </div>
          )}
          <Input
            label="Item Name *"
            placeholder="e.g. Paracetamol 500mg Tablets"
            required
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category *"
              required
              value={addForm.category}
              onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="Drug">Drug / Pharmaceutical</option>
              <option value="Herbal">Herbal Medicine</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Consumable">Medical Consumable</option>
            </Select>
            <Input
              label="Unit of Measure *"
              placeholder="Boxes, Bottles, Vials"
              required
              value={addForm.unit}
              onChange={(e) => setAddForm((f) => ({ ...f, unit: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Reorder Alert Level *"
              type="number"
              min="1"
              required
              value={addForm.reorderLevel}
              onChange={(e) => setAddForm((f) => ({ ...f, reorderLevel: e.target.value }))}
            />
            <Select
              label="Branch Location *"
              required
              value={addForm.branch}
              onChange={(e) => setAddForm((f) => ({ ...f, branch: e.target.value }))}
            >
              <option value="Accra">Accra Main Hospital</option>
              <option value="Mankessim">Mankessim Herbal Centre</option>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={addLoading}>
              {addLoading ? 'Registering...' : 'Register Stock Item'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
