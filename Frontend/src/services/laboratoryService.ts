import { apiClient } from './apiClient';
import { BackendLabOrder, CreateLabOrderDto, SubmitResultsDto, QueryLabOrdersDto, } from '../types';

export const laboratoryService = {
  /**
   * Create a diagnostic laboratory test order from consultation or ward
   * POST /api/v1/laboratory/orders
   */
  async createOrder(dto: CreateLabOrderDto): Promise<BackendLabOrder> {
    const response = await apiClient.post<unknown, BackendLabOrder>('/laboratory/orders', dto);
    return response;
  },

  /**
   * Submit diagnostic test results and optional PDF report attachment
   * POST /api/v1/laboratory/orders/:id/results
   */
  async submitResults(id: string, dto: SubmitResultsDto): Promise<BackendLabOrder> {
    const response = await apiClient.post<unknown, BackendLabOrder>(`/laboratory/orders/${id}/results`, dto);
    return response;
  },

  /**
   * Physician clinical sign-off and approval of lab report
   * PATCH /api/v1/laboratory/orders/:id/approve
   */
  async approveResults(id: string): Promise<BackendLabOrder> {
    const response = await apiClient.patch<unknown, BackendLabOrder>(`/laboratory/orders/${id}/approve`);
    return response;
  },

  /**
   * Upload PDF report attachment for a lab order
   * POST /api/v1/laboratory/orders/:id/attachments
   */
  async addAttachment(id: string, fileName: string, fileSizeKb?: number): Promise<any> {
    const response = await apiClient.post<unknown, any>(`/laboratory/orders/${id}/attachments`, {
      fileName,
      fileSizeKb,
    });
    return response;
  },

  /**
   * Query laboratory diagnostic orders with branch, status, search, and pagination
   * GET /api/v1/laboratory/orders
   */
  async getOrders(query?: QueryLabOrdersDto): Promise<BackendLabOrder[]> {
    const response = await apiClient.get<unknown, BackendLabOrder[]>('/laboratory/orders', {
      params: query,
    });
    return response;
  },

  /**
   * Retrieve full laboratory order details, multi-parameter results, and PDF attachments
   * GET /api/v1/laboratory/orders/:id
   */
  async getOrder(id: string): Promise<BackendLabOrder> {
    const response = await apiClient.get<unknown, BackendLabOrder>(`/laboratory/orders/${id}`);
    return response;
  },
};
