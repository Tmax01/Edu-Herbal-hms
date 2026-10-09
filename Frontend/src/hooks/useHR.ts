import { useState, useEffect, useCallback } from 'react';
import hrService from '../services/hrService';
import { LeaveRequest, OffDutyRequest, HrOverview, CreateLeaveRequestDto, CreateOffDutyRequestDto } from '../types/hr';
export function useHR(branchId?: string, isUserOnly = false, currentUserId?: string) {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [offDuties, setOffDuties] = useState<OffDutyRequest[]>([]);
  const [overview, setOverview] = useState<HrOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHRData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lData, odData, ovData] = await Promise.allSettled([
        hrService.getLeaveRequests({
          branchId: branchId && branchId !== 'All' ? branchId : undefined,
          staffId: isUserOnly ? currentUserId : undefined,
        }),
        hrService.getOffDutyRequests({
          branchId: branchId && branchId !== 'All' ? branchId : undefined,
          staffId: isUserOnly ? currentUserId : undefined,
        }),
        hrService.getOverview(branchId),
      ]);

      if (lData.status === 'fulfilled' && Array.isArray(lData.value)) {
        setLeaves(lData.value);
      }
      if (odData.status === 'fulfilled' && Array.isArray(odData.value)) {
        setOffDuties(odData.value);
      }
      if (ovData.status === 'fulfilled' && ovData.value) {
        setOverview(ovData.value);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load HR data');
    } finally {
      setLoading(false);
    }
  }, [branchId, isUserOnly, currentUserId]);


  useEffect(() => {
    fetchHRData();
  }, [fetchHRData]);

  const applyLeave = async (dto: CreateLeaveRequestDto, currentUserName?: string, branchName?: string) => {
    let created: LeaveRequest | null = null;
    try {
      const res = await hrService.createLeaveRequest(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend leave application failed, applying local state update:', err);
    }

    const from = new Date(dto.startDate);
    const to = new Date(dto.endDate);
    const days = Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1;

    const newLeave: LeaveRequest = created || {
      id: `LV-${String(leaves.length + 1).padStart(3, '0')}`,
      staffId: currentUserId || 'USR-CURR',
      staffName: currentUserName || 'Staff Member',
      type: dto.leaveType,
      from: dto.startDate,
      to: dto.endDate,
      days,
      reason: dto.reason,
      status: 'Pending',
      branch: (branchName === 'All' ? 'Accra' : branchName || 'Accra'),
    };

    setLeaves((prev) => [newLeave, ...prev]);
    return newLeave;
  };

  const applyOffDuty = async (dto: CreateOffDutyRequestDto, currentUserName?: string, deptName?: string, branchName?: string) => {
    let created: OffDutyRequest | null = null;
    try {
      const res = await hrService.createOffDutyRequest(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend off-duty application failed, applying local state update:', err);
    }

    const newOD: OffDutyRequest = created || {
      id: `OD-${String(offDuties.length + 1).padStart(3, '0')}`,
      staffId: currentUserId || 'USR-CURR',
      staffName: currentUserName || 'Staff Member',
      department: deptName || 'General Practice',
      branch: (branchName === 'All' ? 'Accra' : branchName || 'Accra'),
      date: dto.requestedDate,
      shiftType: dto.shiftType,
      reason: dto.reason,
      status: 'Pending',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setOffDuties((prev) => [newOD, ...prev]);
    return newOD;
  };

  const approveLeave = async (id: string, notes?: string, reviewerName?: string) => {
    try {
      await hrService.approveLeaveRequest(id, { status: 'Approved', reviewNotes: notes });
    } catch (err: any) {
      console.warn('Backend leave approval failed, updating locally:', err);
    }
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Approved', approvedBy: reviewerName || 'HR Officer' } : l)));
  };

  const rejectLeave = async (id: string, notes?: string) => {
    try {
      await hrService.approveLeaveRequest(id, { status: 'Rejected', reviewNotes: notes });
    } catch (err: any) {
      console.warn('Backend leave rejection failed, updating locally:', err);
    }
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Rejected' } : l)));
  };

  const approveOffDuty = async (id: string, reviewerName?: string) => {
    try {
      await hrService.approveOffDutyRequest(id, { status: 'Approved' });
    } catch (err: any) {
      console.warn('Backend off-duty approval failed, updating locally:', err);
    }
    setOffDuties((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'Approved', approvedBy: reviewerName || 'HR Officer' } : o)));
  };

  const rejectOffDuty = async (id: string) => {
    try {
      await hrService.approveOffDutyRequest(id, { status: 'Rejected' });
    } catch (err: any) {
      console.warn('Backend off-duty rejection failed, updating locally:', err);
    }
    setOffDuties((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'Rejected' } : o)));
  };

  return {
    leaves,
    offDuties,
    overview,
    loading,
    error,
    refetch: fetchHRData,
    applyLeave,
    applyOffDuty,
    approveLeave,
    rejectLeave,
    approveOffDuty,
    rejectOffDuty,
  };
}

export default useHR;
