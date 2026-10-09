import { useState, useEffect, useCallback } from 'react';
import communicationService from '../services/communicationService';
import { Announcement, CreateAnnouncementDto } from '../types/communication';

const initialAnnouncements: Announcement[] = [
  {
    id: 'ANN-001',
    title: 'Hospital-wide Clinical Audit Meeting',
    content: 'All clinical heads are required to attend the Q3 audit meeting in Conference Room A on Friday at 2:00 PM.',
    authorName: 'Dr. Kwame Mensah',
    authorRole: 'doctor',
    isUrgent: true,
    createdAt: '2026-08-20 09:00',
    branch: 'Accra',
  },
  {
    id: 'ANN-002',
    title: 'New FEFO Inventory Policy Effective Immediately',
    content: 'Pharmacy and store managers must verify batch expiries prior to dispensing or stock transfers.',
    authorName: 'Efua Asiedu',
    authorRole: 'admin',
    isUrgent: false,
    createdAt: '2026-08-18 14:30',
    branch: 'All',
  },
];

export function useCommunication(branchId?: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communicationService.getAnnouncements(branchId);
      if (Array.isArray(data) && data.length > 0) {
        setAnnouncements(data);
      }
    } catch (err: any) {
      console.warn('Communication API offline, using mock data:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const postAnnouncement = async (dto: CreateAnnouncementDto, authorName?: string, authorRole?: string) => {
    let created: Announcement | null = null;
    try {
      const res = await communicationService.createAnnouncement(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend announcement failed, using local state:', err);
    }

    const newA: Announcement = created || {
      id: `ANN-${String(announcements.length + 1).padStart(3, '0')}`,
      title: dto.title,
      content: dto.content,
      authorName: authorName || 'Hospital Admin',
      authorRole: authorRole || 'admin',
      isUrgent: dto.isUrgent,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      branch: (branchId === 'All' ? 'Accra' : branchId || 'Accra'),
    };

    setAnnouncements((prev) => [newA, ...prev]);
    return newA;
  };

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements,
    postAnnouncement,
  };
}

export default useCommunication;
