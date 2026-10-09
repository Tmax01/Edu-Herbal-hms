import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/apiClient';
import { wardService } from '../../services/wardService';
import { nursingService } from '../../services/nursingService';

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Wards & Nursing Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /wards/admissions - allocates an available ward bed to an inpatient', async () => {
    const admitDto = { bedId: 'BED-A01', patientId: 'PAT-001', admitReason: 'Severe malaria admission', notes: 'Severe malaria admission' };
    (apiClient.post as any).mockResolvedValue({ id: 'ADM-001', ...admitDto, status: 'Occupied' });

    const res = await wardService.admitPatient(admitDto);

    expect(apiClient.post).toHaveBeenCalledWith('/wards/admissions', admitDto);
    expect(res.status).toBe('Occupied');
  });

  it('POST /nursing/notes - records shift vitals and nursing observations', async () => {
    const noteDto = { patientName: 'Ama Asante', bedId: 'BED-A01', nurseName: 'Nurse Boateng', note: 'Vitals stable', vitals: { bp: '120/80', pulse: '72', temp: '36.6', spo2: '99%' } };
    (apiClient.post as any).mockResolvedValue({ id: 'NN-001', ...noteDto });

    const res = await nursingService.createNote(noteDto as any);

    expect(apiClient.post).toHaveBeenCalledWith('/nursing/notes', noteDto);
    expect(res.id).toBe('NN-001');
  });
});
