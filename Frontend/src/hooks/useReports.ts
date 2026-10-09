import { useState, useEffect, useCallback } from 'react';
import { QueryReportsDto, ReportSummary } from '../types/reports';
import { reportsService } from '../services/reportsService';

export function useReports(query: QueryReportsDto) {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const data = await reportsService.getReport(query);
    setReport(data);
    setLoading(false);
  }, [query.reportType, query.startDate, query.endDate, query.branch]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportPdf = async () => {
    return await reportsService.exportPdf(query);
  };

  return { report, loading, refresh: fetchReport, exportPdf };
}
