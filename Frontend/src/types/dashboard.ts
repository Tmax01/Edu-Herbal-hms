export interface DashboardOverview {
  branch?: string;
  totalPatients?: number;
  todayAppointments?: any[];
  pendingLabs?: any[];
  pendingLabOrders?: any[];
  lowStock?: any[];
  lowStockItems?: number;
  occupiedBeds?: number;
  totalBeds?: number;
  outstandingInvoicesCount?: number;
  outstandingBalances?: any[];
  totalRevenue?: number;
  timestamp?: string;
  kpis?: {
    patientsToday?: {
      count: number;
      completedCount: number;
      deltaLabel: string;
    };
    revenue?: {
      collectedToday: number;
      deltaLabel: string;
    };
    bedOccupancy?: {
      occupiedCount: number;
      totalBedsCount: number;
      occupancyPercent: number;
      deltaLabel: string;
    };
    inventoryAlerts?: {
      count: number;
      deltaLabel: string;
      badge: string;
      description: string;
    };
  };
}

export interface AnalyticsOverview {
  branch?: string;
  period?: string;
  monthlyPatients?: Array<{ month: string; accra: number; mankessim: number }>;
  deptRevenue?: Array<{ dept: string; amount: number }>;
  appointmentOutcomes?: Array<{ label: string; count: number; color: string }>;
  staffComposition?: Array<{ role: string; count: number }>;
  kpis?: {
    totalPatients?: { value: number | string; label: string; trend: string; trendUp: boolean } | number;
    totalAppointments?: { value: number | string; label: string; trend: string; trendUp: boolean } | number;
    totalRevenue?: { value: number | string; label: string; trend: string; trendUp: boolean } | number;
    totalStaff?: { value: number | string; label: string; trend: string; trendUp: boolean } | number;
    totalLabs?: { value: number | string; label: string; trend: string; trendUp: boolean } | number;
    totalPrescriptions?: { value: number | string; label: string; trend: string; trendUp: boolean } | number;
  };
}
