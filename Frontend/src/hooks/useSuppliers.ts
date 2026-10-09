import { useState, useEffect, useCallback } from 'react';
import { Supplier, CreateSupplierDto } from '../types/inventory';
import { supplierService } from '../services/supplierService';

export function useSuppliers(branchFilter?: string) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supplierService.getAll({ branch: branchFilter });
      setSuppliers(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, [branchFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const addSupplier = async (dto: CreateSupplierDto) => {
    const created = await supplierService.create(dto);
    setSuppliers((prev) => [created, ...prev]);
    return created;
  };

  return { suppliers, loading, error, refresh: fetchSuppliers, addSupplier };
}
