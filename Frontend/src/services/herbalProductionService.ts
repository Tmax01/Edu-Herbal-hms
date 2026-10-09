import { apiClient } from './apiClient';
import { ProductionBatch, CreateProductionBatchDto, UpdateProductionStageDto } from '../types/production';

export const herbalProductionService = {
  getAll: async (params?: { stage?: string; branch?: string }): Promise<ProductionBatch[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.stage) query.append('stage', params.stage);
      if (params?.branch && params.branch !== 'All') query.append('branch', params.branch);

      const res: any = await apiClient.get(`/herbal-production/batches?${query.toString()}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.items)) return res.items;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.data && Array.isArray(res.data.items)) return res.data.items;
      return [];
    } catch (err) {
      console.warn('herbalProductionService.getAll failed:', err);
      return [];
    }
  },

  getById: async (id: string): Promise<ProductionBatch | null> => {
    try {
      const res: any = await apiClient.get(`/herbal-production/batches/${id}`);
      return res?.data || res || null;
    } catch (err) {
      console.warn(`herbalProductionService.getById(${id}) failed:`, err);
      return null;
    }
  },

  createBatch: async (data: CreateProductionBatchDto): Promise<ProductionBatch> => {
    const payload = {
      productName: data.product,
      product: data.product,
      plannedQuantity: data.quantity,
      quantity: data.quantity,
      notes: data.notes,
      branch: data.branch,
    };
    const res: any = await apiClient.post('/herbal-production/batches', payload);
    return res?.data || res;
  },


  updateStage: async (id: string, dto: UpdateProductionStageDto): Promise<ProductionBatch | null> => {
    try {
      const res: any = await apiClient.patch(`/herbal-production/batches/${id}/stage`, dto);
      return res?.data || res || null;
    } catch (err) {
      console.warn(`herbalProductionService.updateStage(${id}) failed:`, err);
      return null;
    }
  },

  advanceStage: async (id: string): Promise<ProductionBatch | null> => {
    try {
      const res: any = await apiClient.patch(`/herbal-production/batches/${id}/advance`, {});
      return res?.data || res || null;
    } catch (err) {
      console.warn(`herbalProductionService.advanceStage(${id}) failed:`, err);
      return null;
    }
  },
};
