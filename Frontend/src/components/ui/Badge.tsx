import { ReactNode } from 'react';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'teal' | 'navy';

const styles: Record<Variant, string> = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-sky-100 text-sky-800',
  muted: 'bg-slate-100 text-slate-600',
  teal: 'bg-teal-100 text-teal-800',
  navy: 'bg-blue-900 text-blue-100',
};

export function Badge({ children, variant = 'default', className = '' }: { children: ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, Variant> = {
    Active: 'success', Inactive: 'muted',
    Scheduled: 'default', 'Checked-in': 'info', 'In Progress': 'warning', Completed: 'success', 'No-show': 'danger',
    Pending: 'warning', Dispensed: 'success', Partial: 'info',
    Unpaid: 'danger', Paid: 'success',
    Available: 'success', Occupied: 'danger', Maintenance: 'warning',
    'Awaiting Approval': 'info', 'QC': 'warning', Packaging: 'info', Rejected: 'danger',
    Mixing: 'info', Processing: 'warning',
    Open: 'danger', 'In Progress ': 'warning', Resolved: 'success',
    Complaint: 'danger', 'Follow-up Scheduled': 'info', Escalated: 'warning', 'No Answer': 'muted',
  };
  return map[status] ?? 'muted';
}
