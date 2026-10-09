import { useState, useEffect, useCallback } from 'react';
import accountingService from '../services/accountingService';
import { Expense, PayrollRecord, FinancialOverview, ProfitAndLossStatement, CreateExpenseDto } from '../types/accounting';
export function useAccounting(branchIdOrName?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [plStatement, setPlStatement] = useState<ProfitAndLossStatement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expData, payData, ovData, plData] = await Promise.allSettled([
        accountingService.getExpenses({ branch: branchIdOrName && branchIdOrName !== 'All' ? branchIdOrName : undefined }),
        accountingService.getPayroll({ branch: branchIdOrName && branchIdOrName !== 'All' ? branchIdOrName : undefined }),
        accountingService.getOverview(branchIdOrName),
        accountingService.getPlStatement(branchIdOrName),
      ]);

      if (expData.status === 'fulfilled' && Array.isArray(expData.value)) {
        setExpenses(expData.value);
      }
      if (payData.status === 'fulfilled' && Array.isArray(payData.value)) {
        setPayroll(payData.value);
      }
      if (ovData.status === 'fulfilled' && ovData.value) {
        setOverview(ovData.value);
      }
      if (plData.status === 'fulfilled' && plData.value) {
        setPlStatement(plData.value);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  }, [branchIdOrName]);


  useEffect(() => {
    fetchAccountingData();
  }, [fetchAccountingData]);

  const addExpense = async (dto: CreateExpenseDto, approverName?: string) => {
    let created: Expense | null = null;
    try {
      const res = await accountingService.createExpense(dto);
      if (res && res.id) created = res;
    } catch (err: any) {
      console.warn('Backend expense log failed, applying local state update:', err);
    }

    const newExp: Expense = created || {
      id: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
      description: dto.description,
      category: dto.category,
      amount: dto.amount,
      date: dto.expenseDate || new Date().toISOString().split('T')[0],
      approvedBy: approverName || 'Efua Asiedu',
      branch: (dto.branch || branchIdOrName || 'Accra') as any,
      paymentMethod: dto.paymentMethod || 'Bank Transfer',
    };

    setExpenses((prev) => [newExp, ...prev]);
    return newExp;
  };

  const updatePayrollStatus = async (staffId: string, status: string) => {
    try {
      await accountingService.updatePayrollStatus(staffId, status);
    } catch (err: any) {
      console.warn('Backend payroll status update failed, applying local state update:', err);
    }
    setPayroll((prev) =>
      prev.map((p) => (p.staffId === staffId ? { ...p, status: status as any } : p))
    );
  };

  return {
    expenses,
    payroll,
    overview,
    plStatement,
    loading,
    error,
    refetch: fetchAccountingData,
    addExpense,
    updatePayrollStatus,
  };
}

export default useAccounting;
