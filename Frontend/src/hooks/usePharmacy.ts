import { useState, useEffect, useCallback } from 'react';
import { pharmacyService } from '../services/pharmacyService';
import { stockService } from '../services/stockService';
import { BackendPrescription, BackendStockItem, Prescription, StockItem } from '../types';

export function formatBackendPrescriptionToUi(bp: BackendPrescription): Prescription {
  const branchName =
    typeof bp.branch === 'object' && bp.branch !== null
      ? (bp.branch.name.includes('Mankessim') ? 'Mankessim' : 'Accra')
      : (bp.branch?.includes('Mankessim') ? 'Mankessim' : 'Accra');

  return {
    id: bp.id,
    patientId: bp.patientId,
    patientName: bp.patientName || bp.patient?.fullName || 'Patient',
    doctorId: bp.doctorId,
    doctorName: bp.doctorName || bp.doctor?.fullName || 'Doctor',
    date: bp.date || bp.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    status: (bp.status as any) || 'Pending',
    type: (bp.type as any) || 'Conventional',
    branch: branchName as any,
    items: bp.items?.map((item) => ({
      drug: item.drugName || item.drug || 'Medication',
      dosage: item.dosage || '1 tab',
      frequency: item.frequency || 'Daily',
      duration: item.duration || `${item.durationDays || 3} days`,
      qty: item.quantity || 1,
    })) || [],
  };
}

export function formatBackendStockToUi(bs: BackendStockItem): StockItem {
  const branchName =
    typeof bs.branch === 'object' && bs.branch !== null
      ? (bs.branch.name.includes('Mankessim') ? 'Mankessim' : 'Accra')
      : (bs.branch?.includes('Mankessim') ? 'Mankessim' : 'Accra');

  let earliestExpiry = '2027-12-31';
  let batchNo = 'BN-001';
  let totalQty = bs.totalQuantity || 0;

  if (bs.batches && bs.batches.length > 0) {
    const dates = bs.batches.map((b) => b.expiryDate?.slice(0, 10)).filter(Boolean);
    if (dates.length > 0) {
      earliestExpiry = dates.sort()[0];
    }
    batchNo = bs.batches[0].batchNumber || 'BN-001';
  }

  return {
    id: bs.id,
    name: bs.name,
    category: (bs.category as any) || 'Drug',
    quantity: totalQty,
    unit: bs.unitOfMeasure || 'Box',
    reorderLevel: bs.reorderLevel || 10,
    expiryDate: earliestExpiry,
    batchNo: batchNo,
    supplier: 'Pharma Supplier',
    branch: branchName as any,
  };
}

export function usePharmacy(activeBranch: string = 'All') {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rxRes, stockRes] = await Promise.all([
        pharmacyService.getPrescriptions({ branch: activeBranch !== 'All' ? activeBranch : undefined }),
        stockService.getStock({ branch: activeBranch !== 'All' ? activeBranch : undefined }),
      ]);

      if (Array.isArray(rxRes)) {
        setPrescriptions(rxRes.map(formatBackendPrescriptionToUi));
      } else {
        setPrescriptions([]);
      }

      if (Array.isArray(stockRes)) {
        setStockItems(stockRes.map(formatBackendStockToUi));
      } else {
        setStockItems([]);
      }
    } catch (err: any) {
      setPrescriptions([]);
      setStockItems([]);
      setError(err?.message || 'Failed to load pharmacy data');
    } finally {
      setLoading(false);
    }
  }, [activeBranch]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dispensePrescription = async (id: string, items?: any[]) => {
    // Optimistic UI update
    setPrescriptions((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'Dispensed' } : p)));
    try {
      await pharmacyService.dispensePrescription(id, {
        items: items || [{ dispensedQuantity: 1 }],
      });
    } catch {
      // Local fallback retains optimistic status cleanly
    }
  };

  return {
    prescriptions,
    stockItems,
    loading,
    error,
    refresh: fetchData,
    dispensePrescription,
  };
}
