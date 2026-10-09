export type TelemedicineStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-show';

export interface TelemedicineSession {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  scheduledTime?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  duration?: number;
  type?: string;
  chiefComplaint?: string;

  status: TelemedicineStatus;
  notes?: string;
  meetingLink?: string;
  branch?: string;
  createdAt?: string;
}

export interface CreateTelemedicineSessionDto {
  patientId: string;
  doctorId?: string;
  scheduledTime: string;
  durationMinutes?: number;
  notes?: string;
}

export interface CompleteTelemedicineSessionDto {
  clinicalNotes: string;
  prescriptions?: any[];
  labRequests?: any[];
  diagnosis?: string;
}

export interface QueryTelemedicineDto {
  status?: TelemedicineStatus;
  doctorId?: string;
  patientId?: string;
  branchId?: string;
  search?: string;
}
