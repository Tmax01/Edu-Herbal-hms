import { useState, useEffect, useCallback } from 'react';
import meetingService from '../services/meetingService';
import { Meeting, CreateMeetingDto } from '../types/communication';
export function useMeetings(branchId?: string, tab = 'upcoming') {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await meetingService.getMeetings(branchId, tab);
      if (Array.isArray(data)) {
        setMeetings(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [branchId, tab]);


  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const scheduleMeeting = async (dto: CreateMeetingDto, organizerName?: string) => {
    let created: Meeting | null = null;
    try {
      const res = await meetingService.createMeeting(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend schedule meeting failed, updating local state:', err);
    }

    const newM: Meeting = created || {
      id: `MTG-${String(meetings.length + 1).padStart(3, '0')}`,
      title: dto.title,
      scheduledAt: dto.scheduledAt,
      durationMinutes: dto.durationMinutes,
      location: dto.location || 'Conference Room A',
      organizerName: organizerName || 'Hospital Admin',
      scope: dto.scope || 'Branch',
      status: 'Scheduled',
      branch: (branchId === 'All' ? 'Accra' : branchId || 'Accra'),
    };

    setMeetings((prev) => [newM, ...prev]);
    return newM;
  };

  const updateMeetingStatus = async (id: string, status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled', minutes?: string) => {
    try {
      await meetingService.updateMeetingStatus(id, status, minutes);
    } catch (err: any) {
      console.warn('Backend update meeting status failed, updating local state:', err);
    }

    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status, minutes: minutes || m.minutes } : m))
    );
  };

  return {
    meetings,
    loading,
    error,
    refetch: fetchMeetings,
    scheduleMeeting,
    updateMeetingStatus,
  };
}

export default useMeetings;
