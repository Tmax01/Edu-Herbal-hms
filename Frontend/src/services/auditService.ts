import { apiClient } from './apiClient';

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  moduleName: string;
  actionType: string;
  ipAddress: string;
  userAgent?: string | null;
  diffState?: {
    targetEntity?: string;
    targetId?: string;
    action?: string;
    branch?: string;
    [key: string]: any;
  } | null;
  createdAt: string;
  actorUser?: {
    id: string;
    fullName: string;
    role: string;
    email: string;
  } | null;
}

export interface QueryAuditLogsParams {
  actorId?: string;
  moduleName?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogsResponse {
  items: AuditLogEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditService = {
  /**
   * Retrieve HIPAA-compliant audit logs from the backend
   */
  async getAuditLogs(query?: QueryAuditLogsParams): Promise<AuditLogsResponse> {
    const res: any = await apiClient.get('/audit-logs', { params: query });
    if (res && Array.isArray(res.items)) {
      return res as AuditLogsResponse;
    }
    if (Array.isArray(res)) {
      return {
        items: res,
        meta: {
          total: res.length,
          page: 1,
          limit: res.length,
          totalPages: 1,
        },
      };
    }
    return {
      items: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },
};

export default auditService;
