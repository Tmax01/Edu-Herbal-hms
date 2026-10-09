export type ExpenseCategory = 'Salaries' | 'Supplies' | 'Utilities' | 'Maintenance' | 'Equipment' | 'Other';
export type PayrollStatus = 'Paid' | 'Pending' | 'On Hold' | 'Processing';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  approvedBy?: string;
  branch: string;
  paymentMethod: string;
  receiptReference?: string;
  createdAt?: string;
}

export interface PayrollRecord {
  id?: string;
  staffId: string;
  name: string;
  role: string;
  branch: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  payrollMonth?: string;
  paidAt?: string;
}


export interface FinancialOverview {
  totalRevenue: number;
  totalExpenses: number;
  totalSalaryExpenses: number;
  netProfit: number;
  collectionRate: number;
  totalBilled: number;
  totalOutstanding: number;
}

export interface ProfitAndLossStatement {
  month: string;
  branch: string;
  revenue: {
    consultations: number;
    pharmacy: number;
    laboratory: number;
    wards: number;
    totalRevenue: number;
  };
  expenses: {
    supplies: number;
    utilities: number;
    maintenance: number;
    other: number;
    totalExpenses: number;
  };
  staffCosts: {
    totalPayrollPaid: number;
  };
  netProfit: number;
}

export interface CreateExpenseDto {
  description: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate?: string;
  paymentMethod?: string;
  branchId?: string;
  branch?: string;
  receiptReference?: string;
}

export interface CreatePayrollDto {
  month: string;
  branchId?: string;
  records: Array<{
    staffId: string;
    basicSalary: number;
    allowances?: number;
    deductions?: number;
  }>;
}

export interface QueryExpensesDto {
  category?: ExpenseCategory;
  branchId?: string;
  branch?: string;
  startDate?: string;
  endDate?: string;
}
