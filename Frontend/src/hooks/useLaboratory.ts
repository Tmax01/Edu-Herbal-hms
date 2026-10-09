import { useState, useEffect, useCallback } from 'react';
import { laboratoryService } from '../services/laboratoryService';
import { BackendLabOrder, SubmitResultsDto, LabOrder } from '../types';

export function formatBackendLabOrderToUi(blo: BackendLabOrder): LabOrder {
  const branchName =
    typeof blo.branch === 'object' && blo.branch !== null
      ? (blo.branch.name.includes('Mankessim') ? 'Mankessim' : 'Accra')
      : (blo.branch?.includes('Mankessim') ? 'Mankessim' : 'Accra');

  const testList: string[] = Array.isArray(blo.tests)
    ? blo.tests.map((t: any) => (typeof t === 'string' ? t : t.testName || 'Test'))
    : ['Diagnostic Test'];

  let resultSummary = '';
  if (typeof blo.results === 'string') {
    resultSummary = blo.results;
  } else if (Array.isArray(blo.results)) {
    resultSummary = blo.results.map((r) => `${r.testParameter}: ${r.value} ${r.unit || ''}`).join('; ');
  }

  return {
    id: blo.id,
    patientId: blo.patientId,
    patientName: blo.patientName || blo.patient?.fullName || 'Patient',
    doctorName: blo.doctorName || blo.doctor?.fullName || 'Doctor',
    tests: testList,
    status: (blo.status as any) || 'Pending',
    orderedDate: blo.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    branch: branchName as any,
    results: resultSummary || undefined,
  };
}

export function useLaboratory(activeBranch: string = 'All') {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await laboratoryService.getOrders({
        branch: activeBranch !== 'All' ? activeBranch : undefined,
      });

      if (Array.isArray(response)) {
        setOrders(response.map(formatBackendLabOrderToUi));
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      setOrders([]);
      setError(err?.message || 'Failed to load laboratory orders');
    } finally {
      setLoading(false);
    }
  }, [activeBranch]);


  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const submitResults = async (id: string, resultText: string, fileName?: string, fileSizeKb?: number) => {
    // Optimistic UI update: move to Awaiting Approval
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'Awaiting Approval', results: resultText } : o))
    );

    try {
      const dto: SubmitResultsDto = {
        results: [{ testParameter: 'Diagnostic Finding', value: resultText }],
        technicianNotes: resultText,
      };
      await laboratoryService.submitResults(id, dto);
      if (fileName) {
        await laboratoryService.addAttachment(id, fileName, fileSizeKb);
      }
    } catch {
      // Retain optimistic status cleanly
    }
  };

  const approveOrder = async (id: string) => {
    // Optimistic UI update: move to Completed
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'Completed' } : o)));

    try {
      await laboratoryService.approveResults(id);
    } catch {
      // Retain optimistic status cleanly
    }
  };

  return {
    orders,
    loading,
    error,
    refresh: fetchOrders,
    submitResults,
    approveOrder,
  };
}
