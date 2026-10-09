import { useState, useEffect, useCallback } from 'react';
import { appointmentService, BackendAppointment, CreateAppointmentDto } from '../services/appointmentService';
import { Appointment } from '../types';

export function formatBackendAppointmentToUi(ba: BackendAppointment): Appointment {
  const branchName =
    typeof ba.branch === 'object' && ba.branch !== null
      ? (ba.branch.name.includes('Mankessim') ? 'Mankessim' : 'Accra')
      : (ba.branch?.includes('Mankessim') ? 'Mankessim' : 'Accra');

  const dateStr = ba.appointmentDate ? ba.appointmentDate.slice(0, 10) : ba.date || new Date().toISOString().slice(0, 10);
  const timeStr = ba.time || (ba.appointmentDate && ba.appointmentDate.includes('T') ? ba.appointmentDate.slice(11, 16) : '09:00');

  return {
    id: ba.id,
    patientId: ba.patientId,
    patientName: ba.patientName || ba.patient?.fullName || 'Patient',
    doctorId: ba.doctorId,
    doctorName: ba.doctorName || ba.doctor?.fullName || 'Doctor',
    department: ba.department || 'General Medicine',
    date: dateStr,
    time: timeStr,
    status: (ba.status as any) || 'Scheduled',
    notes: ba.notes || ba.reason || '',
    branch: branchName as any,
  };
}

export function useAppointments(filterDate: string = '', filterDoctor: string = '', activeBranch: string = 'All') {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentService.getAppointments({
        date: filterDate || undefined,
        doctorId: filterDoctor || undefined,
        branch: activeBranch !== 'All' ? activeBranch : undefined,
      });

      if (Array.isArray(response)) {
        setAppointments(response.map(formatBackendAppointmentToUi));
      } else {
        setAppointments([]);
      }
    } catch (err: any) {
      setAppointments([]);
      setError(err?.message || 'Failed to load appointments data');
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterDoctor, activeBranch]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    // Optimistic UI update
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      if (status === 'Checked-in') {
        await appointmentService.checkIn(id);
      } else {
        await appointmentService.updateStatus(id, status);
      }
    } catch {
      // Retain optimistic UI state cleanly
    }
  };

  const createAppointment = async (dto: CreateAppointmentDto): Promise<{ success: boolean; data?: Appointment; error?: string }> => {
    try {
      const created = await appointmentService.createAppointment(dto);
      const formatted = formatBackendAppointmentToUi(created);
      setAppointments((prev) => [formatted, ...prev]);
      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to schedule appointment';
      return {
        success: false,
        error: Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage,
      };
    }
  };


  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
    updateStatus,
    createAppointment,
  };
}
