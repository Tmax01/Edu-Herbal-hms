export interface BackendAppointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  department?: string;
  appointmentDate: string;
  date?: string;
  time?: string;
  status: 'Scheduled' | 'Checked-in' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-show';
  reason?: string;
  notes?: string;
  type?: string;
  branchId?: string;
  branch?: { id: string; name: string } | string;
  patient?: any;
  doctor?: any;
  createdAt?: string;
}

export interface CreateAppointmentDto {
  patientId?: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  department?: string;
  appointmentDate?: string;
  date?: string;
  time?: string;
  type?: string;
  reason?: string;
  notes?: string;
  branchId?: string;
  branch?: string;
}

export interface QueryAppointmentsDto {
  search?: string;
  status?: string;
  doctorId?: string;
  patientId?: string;
  branchId?: string;
  branch?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  page?: number;
  limit?: number;
}
