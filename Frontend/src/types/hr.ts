export type LeaveType = 'Annual' | 'Sick' | 'Maternity' | 'Study' | 'Casual' | 'Unpaid' | 'Emergency';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type ShiftType = 'Morning' | 'Afternoon' | 'Night' | 'Full Day';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: RequestStatus;
  branch: string;
  approvedBy?: string;
  reviewNotes?: string;
  createdAt?: string;
}

export interface OffDutyRequest {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  branch: string;
  date: string;
  shiftType: ShiftType;
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  approvedBy?: string;
  reviewNotes?: string;
}

export interface HrOverview {
  totalStaff: number;
  activeStaff: number;
  staffOnLeave: number;
  pendingLeaveRequests: number;
  pendingOffDutyRequests: number;
}

export interface CreateLeaveRequestDto {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ApproveLeaveRequestDto {
  status: 'Approved' | 'Rejected';
  reviewNotes?: string;
}

export interface CreateOffDutyRequestDto {
  requestedDate: string;
  shiftType: ShiftType;
  reason: string;
}

export interface ApproveOffDutyDto {
  status: 'Approved' | 'Rejected';
  reviewNotes?: string;
}

export interface QueryHrDto {
  status?: RequestStatus;
  branchId?: string;
  branch?: string;
  staffId?: string;
}
