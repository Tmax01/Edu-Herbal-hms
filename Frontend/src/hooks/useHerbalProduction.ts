import { useState, useEffect, useCallback } from 'react';
import { ProductionBatch, CreateProductionBatchDto, ProductionStage } from '../types/production';
import { herbalProductionService } from '../services/herbalProductionService';

const stageOrder: ProductionStage[] = ['Mixing', 'Processing', 'QC', 'Packaging', 'Completed'];

export function useHerbalProduction(branchFilter?: string) {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await herbalProductionService.getAll({ branch: branchFilter });
      setBatches(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch production batches');
    } finally {
      setLoading(false);
    }
  }, [branchFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const createBatch = async (dto: CreateProductionBatchDto) => {
    const created = await herbalProductionService.createBatch(dto);
    setBatches((prev) => [created, ...prev]);
    return created;
  };

  const advanceStage = async (id: string) => {
    const updated = await herbalProductionService.advanceStage(id);
    if (updated) {
      setBatches((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } else {
      // Local fallback
      setBatches((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          const idx = stageOrder.indexOf(b.stage);
          const next = stageOrder[Math.min(idx + 1, stageOrder.length - 1)];
          return { ...b, stage: next };
        })
      );
    }
  };

  return { batches, loading, error, refresh: fetchBatches, createBatch, advanceStage };
}
