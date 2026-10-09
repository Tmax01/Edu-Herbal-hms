export type BedStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Cleaning';

export interface WardBed {
  id: string;
  ward: string;
  bedNumber: string;
  status: BedStatus;
  patientName?: string;
  patientId?: string;
  admittedDate?: string;
  branch?: string;
}

export interface Bed {
  id: string;
  wardId: string;
  bedNumber: string;
  status: BedStatus;
  currentAdmissionId?: string;
  patientName?: string;
  patientId?: string;
  createdAt?: string;
}

export interface Ward {
  id: string;
  name: string;
  code?: string;
  branchId?: string;
  gender?: 'Male' | 'Female' | 'Mixed';
  capacity?: number;
  occupiedCount?: number;
  beds: Bed[];
  createdAt?: string;
}

export interface InpatientAdmission {
  id: string;
  patientId: string;
  patientName?: string;
  bedId: string;
  bedNumber?: string;
  wardName?: string;
  admittingDoctorId?: string;
  admittingDoctorName?: string;
  admitReason: string;
  admittedAt: string;
  dischargedAt?: string;
  dischargeSummary?: string;
  status: 'Admitted' | 'Discharged' | 'Transferred';
}

export interface CreateWardDto {
  name: string;
  code?: string;
  branchId?: string;
  gender?: 'Male' | 'Female' | 'Mixed';
  capacity?: number;
}

export interface CreateBedDto {
  wardId: string;
  bedNumber: string;
}

export interface CreateAdmissionDto {
  patientId: string;
  bedId: string;
  admitReason: string;
  notes?: string;
}

export interface DischargeAdmissionDto {
  dischargeSummary?: string;
  dischargedAt?: string;
}
