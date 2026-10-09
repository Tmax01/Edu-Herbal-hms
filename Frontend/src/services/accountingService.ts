import { apiClient } from './apiClient';
import { Expense, PayrollRecord, FinancialOverview, ProfitAndLossStatement, CreateExpenseDto, CreatePayrollDto, QueryExpensesDto,
} from '../types/accounting';

export const accountingService = {
  /**
   * Record operational and administrative hospital expenses
   */
  async createExpense(dto: CreateExpenseDto): Promise<Expense> {
    return await apiClient.post('/accounting/expenses', dto);
  },

  /**
   * Query hospital operational expense entries with category and branch filters
   */
  async getExpenses(query?: QueryExpensesDto): Promise<Expense[]> {
    return await apiClient.get('/accounting/expenses', { params: query });
  },

  /**
   * Process monthly staff payroll
   */
  async processPayroll(dto: CreatePayrollDto): Promise<PayrollRecord[]> {
    return await apiClient.post('/accounting/payroll', dto);
  },

  /**
   * Retrieve monthly staff payroll records
   */
  async getPayroll(params?: { payrollMonth?: string; month?: string; branchId?: string; branch?: string }): Promise<PayrollRecord[]> {
    return await apiClient.get('/accounting/payroll', { params });
  },

  /**
   * Update staff payroll payment status (Paid, Pending, On Hold)
   */
  async updatePayrollStatus(id: string, status: string): Promise<PayrollRecord> {
    return await apiClient.patch(`/accounting/payroll/${id}/status`, { status });
  },

  /**
   * Retrieve executive financial summary: revenue, collections, expenses, and net cash flow
   */
  async getOverview(branchIdOrName?: string): Promise<FinancialOverview> {
    const params: Record<string, any> = {};
    if (branchIdOrName && branchIdOrName !== 'All') {
      params.branch = branchIdOrName;
    }
    return await apiClient.get('/accounting/overview', { params });
  },

  /**
   * Generate facility Profit & Loss (P&L) Statement itemized by revenue source and expense category
   */
  async getPlStatement(branch?: string, month?: string): Promise<ProfitAndLossStatement> {
    const params: Record<string, any> = {};
    if (branch && branch !== 'All') params.branch = branch;
    if (month) params.month = month;
    return await apiClient.get('/accounting/pl-statement', { params });
  },
};

export default accountingService;
