import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { appointmentService } from '../../services/appointmentService';
import { vitalsService } from '../../services/vitalsService';
import { consultationService } from '../../services/consultationService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Clinical Services Unit Tests (Appointments, Vitals, Consultations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /appointments - schedules a consultation slot with a doctor', async () => {
    const payload = { patientId: 'PAT-001', doctorId: 'USR-003', date: '2026-08-25', time: '09:00', branch: 'Accra' };
    (apiClient.post as any).mockResolvedValue({ id: 'APT-001', ...payload, status: 'Scheduled' });

    const appt = await appointmentService.createAppointment(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/appointments', payload);
    expect(appt.status).toBe('Scheduled');
  });

  it('POST /vitals - records patient triage blood pressure and temperature', async () => {
    const vitalsPayload = { patientId: 'PAT-001', bp: '120/80', temperature: 36.8, pulseRate: 72 };
    (apiClient.post as any).mockResolvedValue({ id: 'VIT-001', ...vitalsPayload });

    const res = await vitalsService.recordVitals(vitalsPayload);

    expect(apiClient.post).toHaveBeenCalledWith('/vitals', vitalsPayload);
    expect(res.pulseRate).toBe(72);
  });

  it('POST /consultations - records SOAP note encounter with prescriptions', async () => {
    const dto = {
      patientId: 'PAT-001',
      doctorId: 'USR-003',
      chiefComplaint: 'Headache',
      diagnosis: 'Migraine',
    };
    (apiClient.post as any).mockResolvedValue({ id: 'ENC-001', ...dto });

    const res = await consultationService.createConsultation(dto as any);

    expect(apiClient.post).toHaveBeenCalledWith('/consultations', dto);
    expect(res.id).toBe('ENC-001');
  });
});
