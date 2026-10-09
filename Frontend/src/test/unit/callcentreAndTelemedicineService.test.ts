import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import callcentreService from '../../services/callcentreService';
import telemedicineService from '../../services/telemedicineService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Call Centre & Telemedicine Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /call-centre/logs - logs patient phone call inquiry', async () => {
    const callDto = { patientName: 'Adjoa Mensah', agentName: 'Agent Agyei', reason: 'Appointment Inquiry', notes: 'Confirmed slot', outcome: 'Resolved' as const };
    (apiClient.post as any).mockResolvedValue({ id: 'CL-001', ...callDto });

    const res = await callcentreService.createCallLog(callDto as any);

    expect(apiClient.post).toHaveBeenCalledWith('/call-centre/logs', callDto);
    expect(res.outcome).toBe('Resolved');
  });

  it('GET /telemedicine/sessions - retrieves scheduled virtual video consults', async () => {
    (apiClient.get as any).mockResolvedValue([{ id: 'TLM-001', patientName: 'Adjoa Mensah', status: 'Scheduled' }]);

    const sessions = await telemedicineService.getSessions({ status: 'Scheduled' });

    expect(apiClient.get).toHaveBeenCalledWith('/telemedicine/sessions', { params: { status: 'Scheduled' } });
    expect(sessions[0].status).toBe('Scheduled');
  });
});
