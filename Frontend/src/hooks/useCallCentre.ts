import { useState, useEffect, useCallback } from 'react';
import callcentreService from '../services/callcentreService';
import { CallLog, PatientFollowUp, CreateCallLogDto, CreatePatientFollowUpDto } from '../types/callcentre';
export function useCallCentre(branchId?: string) {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [followUps, setFollowUps] = useState<PatientFollowUp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCallCentreData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cData, fData] = await Promise.allSettled([
        callcentreService.getCallLogs(branchId),
        callcentreService.getFollowUps(undefined, branchId),
      ]);

      if (cData.status === 'fulfilled' && Array.isArray(cData.value)) {
        setCallLogs(cData.value);
      }
      if (fData.status === 'fulfilled' && Array.isArray(fData.value)) {
        setFollowUps(fData.value);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load call centre data');
    } finally {
      setLoading(false);
    }
  }, [branchId]);


  useEffect(() => {
    fetchCallCentreData();
  }, [fetchCallCentreData]);

  const logCall = async (dto: CreateCallLogDto, agentName?: string) => {
    let created: CallLog | null = null;
    try {
      const res = await callcentreService.createCallLog(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend call log failed, updating local state:', err);
    }

    const newLog: CallLog = created || {
      id: `LOG-${String(callLogs.length + 1).padStart(3, '0')}`,
      patientName: dto.patientName || 'Patient',
      patientId: dto.patientId,
      agentName: agentName || 'Call Centre Agent',
      reason: dto.reason || dto.purpose || 'Inbound Call',
      notes: dto.notes,
      outcome: dto.outcome || 'Resolved',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      branch: (branchId === 'All' ? 'Accra' : branchId || 'Accra'),
    };

    setCallLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const addFollowUp = async (dto: CreatePatientFollowUpDto, doctorName?: string, patientName?: string) => {
    let created: PatientFollowUp | null = null;
    try {
      const res = await callcentreService.createFollowUp(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend follow-up schedule failed, updating local state:', err);
    }

    const newFU: PatientFollowUp = created || {
      id: `FOL-${String(followUps.length + 1).padStart(3, '0')}`,
      patientName: patientName || 'Patient',
      patientId: dto.patientId,
      doctorName: doctorName || 'Dr. Mensah',
      scheduledDate: dto.scheduledDate,
      reason: dto.reason,
      type: dto.type || 'Review',
      status: 'Due',
      notes: dto.notes,
      branch: (branchId === 'All' ? 'Accra' : branchId || 'Accra'),
    };

    setFollowUps((prev) => [newFU, ...prev]);
    return newFU;
  };

  const markFollowUpCompleted = async (id: string, notes?: string) => {
    try {
      await callcentreService.updateFollowUpStatus(id, 'Completed', notes);
    } catch (err: any) {
      console.warn('Backend follow-up status update failed, updating local state:', err);
    }

    setFollowUps((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'Completed', notes: notes || f.notes } : f))
    );
  };

  return {
    callLogs,
    followUps,
    loading,
    error,
    refetch: fetchCallCentreData,
    logCall,
    addFollowUp,
    markFollowUpCompleted,
  };
}

export default useCallCentre;
