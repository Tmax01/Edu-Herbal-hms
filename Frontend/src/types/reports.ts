export interface QueryReportsDto {
  type?: 'revenue' | 'patients' | 'appointments' | 'inventory';
  reportType?: 'revenue' | 'patients' | 'appointments' | 'inventory';
  startDate?: string;
  endDate?: string;
  branch?: string;
  from?: string;
  to?: string;
}

export interface ReportSummary {
  totalBilled?: number;
  totalCollected?: number;
  totalOutstanding?: number;
  invoiceCount?: number;
  totalPatients?: number;
  totalAppointments?: number;
  totalStockItems?: number;
  data?: any[];
  [key: string]: any;
}

export interface RevenueReportData {
  reportType: 'revenue';
  summary: {
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    invoiceCount: number;
  };
  categoryBreakdown?: {
    consultations: number;
    pharmacy: number;
    laboratory: number;
    inpatient: number;
  };
  invoices: Array<{
    id: string;
    patientId: string;
    patientName: string;
    visitDate: string;
    total: number;
    paid: number;
    outstanding: number;
    status: string;
    percentage: number;
  }>;
}

export interface PatientReportData {
  reportType: 'patients';
  summary: {
    totalPatients: number;
    registeredThisMonth: number;
    femalePatients: number;
    malePatients: number;
  };
  patients: Array<{
    id: string;
    mrn: string;
    name: string;
    gender: string;
    phone: string;
    branch: string;
    registeredDate: string;
  }>;
}

export interface AppointmentReportData {
  reportType: 'appointments';
  summary: {
    total: number;
    scheduled: number;
    checkedIn: number;
    completed: number;
    noShow: number;
  };
  byProvider: Array<{
    doctorName: string;
    count: number;
    percentage: number;
  }>;
  appointments: Array<{
    id: string;
    patientName: string;
    mrn: string;
    doctorName: string;
    department: string;
    date: string;
    time: string;
    status: string;
  }>;
}

export interface InventoryReportData {
  reportType: 'inventory';
  summary: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    okItems: number;
  };
  items: Array<{
    id: string;
    name: string;
    category?: string;
    branch: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    isLow: boolean;
    status: string;
  }>;
}

export type ReportResult = RevenueReportData | PatientReportData | AppointmentReportData | InventoryReportData;
