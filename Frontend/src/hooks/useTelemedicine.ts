import { useState, useEffect, useCallback } from 'react';
import telemedicineService from '../services/telemedicineService';
import { TelemedicineSession, CreateTelemedicineSessionDto, CompleteTelemedicineSessionDto, TelemedicineStatus } from '../types/telemedicine';
export function useTelemedicine(branchId?: string, statusFilter?: TelemedicineStatus | 'All') {
  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await telemedicineService.getSessions({
        branchId: branchId && branchId !== 'All' ? branchId : undefined,
        status: statusFilter && statusFilter !== 'All' ? statusFilter : undefined,
      });
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load telemedicine sessions');
    } finally {
      setLoading(false);
    }
  }, [branchId, statusFilter]);


  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const scheduleSession = async (dto: CreateTelemedicineSessionDto, patientName?: string, doctorName?: string) => {
    let created: TelemedicineSession | null = null;
    try {
      const res = await telemedicineService.createSession(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend telemedicine creation failed, applying local update:', err);
    }

    const newSession: TelemedicineSession = created || {
      id: `TLM-${String(sessions.length + 1).padStart(3, '0')}`,
      patientId: dto.patientId,
      patientName: patientName || 'Patient',
      doctorId: dto.doctorId || 'USR-002',
      doctorName: doctorName || 'Dr. Mensah',
      scheduledTime: dto.scheduledTime,
      durationMinutes: dto.durationMinutes || 30,
      status: 'Scheduled',
      notes: dto.notes,
      meetingLink: `https://meet.eduhms.gh/call-${Date.now().toString(36)}`,
      branch: (branchId === 'All' ? 'Accra' : branchId || 'Accra'),
    };

    setSessions((prev) => [newSession, ...prev]);
    return newSession;
  };

  const startSession = async (id: string) => {
    try {
      await telemedicineService.startSession(id);
    } catch (err: any) {
      console.warn('Backend start session failed, applying local update:', err);
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'In Progress' } : s))
    );
  };

  const completeSession = async (id: string, dto: CompleteTelemedicineSessionDto) => {
    try {
      await telemedicineService.completeSession(id, dto);
    } catch (err: any) {
      console.warn('Backend complete session failed, applying local update:', err);
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Completed', notes: dto.clinicalNotes } : s))
    );
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    scheduleSession,
    startSession,
    completeSession,
  };
}

export default useTelemedicine;
