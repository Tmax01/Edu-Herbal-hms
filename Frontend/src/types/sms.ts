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
