import { apiClient } from './apiClient';
import { Supplier, CreateSupplierDto } from '../types/inventory';

export const supplierService = {
  getAll: async (params?: { category?: string; branch?: string }): Promise<Supplier[]> => {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.append('type', params.category);
      if (params?.branch && params.branch !== 'All') query.append('branch', params.branch);

      const res: any = await apiClient.get(`/suppliers?${query.toString()}`);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.items)) return res.items;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.data && Array.isArray(res.data.items)) return res.data.items;
      return [];
    } catch (err) {
      console.error('supplierService.getAll failed:', err);
      return [];
    }
  },

  getById: async (id: string): Promise<Supplier | null> => {
    try {
      const res: any = await apiClient.get(`/suppliers/${id}`);
      return res?.data || res || null;
    } catch (err) {
      console.error(`supplierService.getById(${id}) failed:`, err);
      return null;
    }
  },

  create: async (data: CreateSupplierDto): Promise<Supplier> => {
    const res: any = await apiClient.post('/suppliers', data);
    return res?.data || res;
  },
};

