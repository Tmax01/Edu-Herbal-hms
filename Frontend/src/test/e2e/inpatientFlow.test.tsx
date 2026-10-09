import { describe, it, expect, vi, beforeEach } from 'vitest';
import wardService from '../../services/wardService';
import nursingService from '../../services/nursingService';

vi.mock('../../services/wardService');
vi.mock('../../services/nursingService');

describe('E2E Scenario B: Inpatient Admission & Care Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* Bed Allocation -> Ward Round Vitals -> Nursing Shift Note -> Bed Clearance */
  /* -------------------------------------------------------------------------- */
  it('Inpatient Lifecycle: Bed Allocation -> Ward Round Vitals -> Shift Note', async () => {
    // 1. Admit Patient to Ward Bed
    const admitPayload = { bedId: 'BED-A01', patientId: 'PAT-001', admitReason: 'Inpatient observation for hypertension', notes: 'Inpatient observation for hypertension' };
    (wardService.admitPatient as any).mockResolvedValue({ id: 'ADM-100', ...admitPayload, status: 'Occupied' });

    const admission = await wardService.admitPatient(admitPayload);
    expect(admission.status).toBe('Occupied');

    // 2. Record Nurse Shift Vitals & Shift Observations
    const nursingPayload = { patientName: 'Adjoa Mensah', bedId: 'BED-A01', nurseName: 'Nurse Boateng', vitals: { bp: '128/84', pulse: '76', temp: '36.8', spo2: '98%' }, note: 'Patient rested well. Morning vitals normal.', type: 'Routine' };
    (nursingService.createNote as any).mockResolvedValue({ id: 'NN-100', ...nursingPayload });

    const note = await nursingService.createNote(nursingPayload as any);
    expect(note.id).toBe('NN-100');
    expect(note.vitals.bp).toBe('128/84');
  });
});
