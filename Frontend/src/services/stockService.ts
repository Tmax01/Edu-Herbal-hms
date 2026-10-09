import { apiClient } from './apiClient';

export const stockService = {
  /**
   * Register a new stock item catalog entry
   * POST /api/v1/stock/items
   */
  async createItem(dto: any): Promise<any> {
    const payload = {
      name: dto.name,
      category: dto.category || 'Pharmaceuticals',
      unit: dto.unit || dto.unitOfMeasure || 'Boxes',
      reorderLevel: Number(dto.reorderLevel || 10),
      branchId: dto.branchId || (dto.branch?.toLowerCase().includes('mankessim') ? 'mankessim-herbal-branch-002' : 'accra-main-branch-001'),
    };
    const response = await apiClient.post<unknown, any>('/stock/items', payload);
    return response;
  },

  /**
   * Receive new inventory shipment batch with FEFO expiry tracking
   * POST /api/v1/stock/batches
   */
  async addBatch(dto: any): Promise<any> {
    const response = await apiClient.post<unknown, any>('/stock/batches', dto);
    return response;
  },

  /**
   * Transfer stock inventory between hospital branches (Accra <-> Mankessim)
   * POST /api/v1/stock/transfer
   */
  async transferStock(dto: any): Promise<any> {
    const payload = {
      stockItemId: dto.stockItemId || dto.itemId || dto.item,
      quantity: Number(dto.quantity),
      destinationBranch: dto.destinationBranch || dto.destination || dto.targetBranchId || 'Accra',
    };
    const response = await apiClient.post<unknown, any>('/stock/transfer', payload);
    return response;
  },

  /**
   * Record manual inventory adjustments, returns, or write-offs
   * POST /api/v1/stock/transactions
   */
  async recordTransaction(dto: any): Promise<any> {
    const response = await apiClient.post<unknown, any>('/stock/transactions', dto);
    return response;
  },

  /**
   * Query inventory stock levels, batch expiries, and reorder alerts
   * GET /api/v1/stock
   */
  async getStock(query?: any): Promise<any[]> {
    const response = await apiClient.get<unknown, any[]>('/stock', { params: query });
    return response;
  },
};
