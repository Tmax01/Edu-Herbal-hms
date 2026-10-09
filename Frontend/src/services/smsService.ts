import { apiClient } from './apiClient';

export interface SendSmsPayload {
  recipientPhone: string;
  message: string;
  recipientName?: string;
  patientId?: string;
}

export interface SmsLog {
  id: string;
  recipientPhone: string;
  message: string;
  status: string;
  sentAt: string;
  gatewayResponse?: string;
}

export const smsService = {
  /**
   * Dispatch SMS notifications to patients via Arkesel Ghana gateway
   * POST /api/v1/sms/send
   */
  async sendSms(payload: SendSmsPayload): Promise<{ message: string; success: boolean }> {
    const response = await apiClient.post<unknown, { message: string; success: boolean }>('/sms/send', payload);
    return response;
  },

  /**
   * Audit SMS gateway logs, delivery receipts, and recipient telephone records
   * GET /api/v1/sms/logs
   */
  async getLogs(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<SmsLog[]> {
    const response = await apiClient.get<unknown, SmsLog[]>('/sms/logs', { params });
    return response;
  },
};
