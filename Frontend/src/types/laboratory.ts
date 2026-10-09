export interface LabResultParameter {
  testParameter: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
}

export interface SubmitResultsDto {
  results: LabResultParameter[];
  technicianNotes?: string;
}

export interface CreateLabOrderDto {
  patientId: string;
  appointmentId?: string;
  consultationId?: string;
  tests: Array<{
    testName: string;
    specimenType?: string;
  }>;
  urgency?: 'Routine' | 'Urgent' | 'Emergency' | string;
  notes?: string;
  branchId?: string;
}

export interface QueryLabOrdersDto {
  search?: string;
  status?: string;
  patientId?: string;
  doctorId?: string;
  branchId?: string;
  branch?: string;
  page?: number;
  limit?: number;
}

export interface LabAttachment {
  id: string;
  labOrderId: string;
  fileName: string;
  fileSizeKb?: number;
  fileUrl?: string;
  createdAt: string;
}

export interface BackendLabOrder {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  branchId?: string;
  branch?: { id: string; name: string } | string;
  status: 'Pending' | 'In Progress' | 'Awaiting Approval' | 'Completed';
  urgency?: string;
  notes?: string;
  tests: Array<{ testName: string; specimenType?: string } | string>;
  results?: LabResultParameter[] | string;
  technicianNotes?: string;
  attachments?: LabAttachment[];
  approvedById?: string;
  approvedBy?: { fullName: string };
  createdAt: string;
  updatedAt: string;
  patient?: any;
  doctor?: any;
}
