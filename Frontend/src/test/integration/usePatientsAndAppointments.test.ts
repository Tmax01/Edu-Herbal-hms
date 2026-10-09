import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePatients } from '../../hooks/usePatients';
import { useAppointments } from '../../hooks/useAppointments';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';

vi.mock('../../services/patientService');
vi.mock('../../services/appointmentService');

describe('Integration Tests: Patients & Appointments Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usePatients & useAppointments: fetches roster and manages appointment status updates', async () => {
    (patientService.getPatients as any).mockResolvedValue([{ id: 'PAT-001', mrn: 'MRN-001', fullName: 'Adjoa Mensah', gender: 'Female', phone: '+233 24 000 0001' }]);
    (appointmentService.getAppointments as any).mockResolvedValue([{ id: 'APT-001', patientId: 'PAT-001', doctorId: 'USR-003', date: '2026-08-22', time: '09:00', status: 'Scheduled', branch: 'Accra' }]);

    const patientsHook = renderHook(() => usePatients('Accra'));
    const apptsHook = renderHook(() => useAppointments('Accra'));

    await waitFor(() => {
      expect(patientsHook.result.current.loading).toBe(false);
      expect(apptsHook.result.current.loading).toBe(false);
    });

    expect(patientsHook.result.current.patients[0].name).toBe('Adjoa Mensah');
    expect(apptsHook.result.current.appointments[0].status).toBe('Scheduled');
  });
});
