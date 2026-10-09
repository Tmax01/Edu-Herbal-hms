import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import chatService from '../../services/chatService';
import dailyReportService from '../../services/dailyReportService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Communication & Daily Reports Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /chat/messages - broadcasts message to clinical chat channel', async () => {
    const msgDto = { senderId: 'USR-003', senderName: 'Dr. Mensah', channel: 'clinical', content: 'Vitals update ready' };
    (apiClient.post as any).mockResolvedValue({ id: 'MSG-001', ...msgDto });

    const res = await chatService.sendMessage(msgDto as any);

    expect(apiClient.post).toHaveBeenCalledWith('/chat/messages', msgDto);
    expect(res.content).toBe('Vitals update ready');
  });

  it('POST /daily-reports - submits staff end-of-shift daily activity report', async () => {
    const rptDto = { staffId: 'USR-003', staffName: 'Dr. Mensah', role: 'doctor' as const, department: 'General', date: '2026-08-22', activities: 'Handled 12 OPD cases', patientsHandled: 12, challenges: 'None', recommendations: 'None' };
    (apiClient.post as any).mockResolvedValue({ id: 'RPT-001', ...rptDto, status: 'Submitted' });

    const res = await dailyReportService.createReport(rptDto as any);

    expect(apiClient.post).toHaveBeenCalledWith('/daily-reports', rptDto);
    expect(res.status).toBe('Submitted');
  });
});
