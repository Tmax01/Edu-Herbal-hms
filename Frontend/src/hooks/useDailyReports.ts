import { useState, useEffect, useCallback } from 'react';
import dailyReportService from '../services/dailyReportService';
import { DailyReport, CreateDailyReportDto } from '../types/communication';
export function useDailyReports(branchId?: string, isMyOnly = false) {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = isMyOnly
        ? await dailyReportService.getMyReports()
        : await dailyReportService.getReports({ branch: branchId && branchId !== 'All' ? branchId : undefined });
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  }, [branchId, isMyOnly]);


  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const submitReport = async (dto: CreateDailyReportDto, staffId?: string, staffName?: string, deptName?: string, branchName?: string) => {
    let created: DailyReport | null = null;
    try {
      const res = await dailyReportService.createReport(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend report submission failed, updating local state:', err);
    }

    const newR: DailyReport = created || {
      id: `RPT-${String(reports.length + 1).padStart(3, '0')}`,
      staffId: staffId || 'USR-001',
      staffName: staffName || 'Staff Member',
      department: dto.department || deptName || 'General Practice',
      branch: (branchName === 'All' ? 'Accra' : branchName || 'Accra'),
      date: dto.reportDate || new Date().toISOString().split('T')[0],
      summary: dto.summary,
      keyActivities: dto.keyActivities,
      challenges: dto.challenges,
      status: 'Submitted',
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setReports((prev) => [newR, ...prev]);
    return newR;
  };

  const reviewReport = async (id: string, status: 'Reviewed' | 'Approved' | 'Noted', notes?: string, reviewerName?: string) => {
    try {
      await dailyReportService.reviewReport(id, { status, reviewNotes: notes });
    } catch (err: any) {
      console.warn('Backend report review failed, updating local state:', err);
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: status === 'Noted' ? 'Reviewed' : (status as any),
              reviewedBy: reviewerName || 'Department Head',
              reviewNotes: notes || r.reviewNotes,
            }
          : r
      )
    );
  };

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    submitReport,
    reviewReport,
  };
}

export default useDailyReports;
