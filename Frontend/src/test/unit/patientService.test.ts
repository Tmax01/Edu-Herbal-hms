import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { patientService } from '../../services/patientService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Patient Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /patients - queries registered patients with branch filter', async () => {
    const mockPatients = [
      { id: 'PAT-001', mrn: 'MRN-001', fullName: 'Adjoa Mensah', gender: 'Female', phone: '+233 24 000 0001' },
    ];
    (apiClient.get as any).mockResolvedValue(mockPatients);

    const patients = await patientService.getPatients({ branch: 'Accra' });

    expect(apiClient.get).toHaveBeenCalledWith('/patients', { params: { branch: 'Accra' } });
    expect(patients).toHaveLength(1);
  });

  it('POST /patients - registers a new patient with auto-generated MRN', async () => {
    const payload = { fullName: 'Kwaku Duah', gender: 'Male', phone: '+233 55 123 4567', branch: 'Accra' };
    (apiClient.post as any).mockResolvedValue({ id: 'PAT-002', mrn: 'MRN-2026-0002', ...payload });

    const newPatient = await patientService.createPatient(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/patients', payload);
    expect(newPatient.id).toBe('PAT-002');
    expect(newPatient.mrn).toBe('MRN-2026-0002');
  });
});
