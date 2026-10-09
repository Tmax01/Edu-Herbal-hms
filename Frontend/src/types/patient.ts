export interface EmergencyContact {
  id?: string;
  contactName: string;
  relationship: string;
  phone: string;
}

export interface PatientAllergy {
  id?: string;
  allergenName: string;
  severity?: string;
  reaction?: string;
}

export interface BackendPatient {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth?: string;
  dob?: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  nhisId?: string;
  registrationBranchId?: string;
  branch?: { id: string; name: string; code: string } | string;
  photoUrl?: string;
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
  emergencyContacts?: EmergencyContact[];
  allergies?: PatientAllergy[] | string[];
  vitals?: any[];
  consultations?: any[];
  labOrders?: any[];
  prescriptions?: any[];
  admissions?: any[];
  followUps?: any[];
}

export interface CreatePatientPayload {
  name?: string;
  fullName?: string;
  dob?: string;
  dateOfBirth?: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  nhisId?: string;
  branch?: string;
  registrationBranchId?: string;
  notes?: string;
  generalNotes?: string;
  photoUrl?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyContacts?: EmergencyContact[];
  allergies?: string | string[] | PatientAllergy[];
  vitals_bp?: string;
  vitals_sugar?: string;
  vitals_weight?: string | number;
  vitals_height?: string | number;
  sendWelcomeSms?: boolean;
}

export interface QueryPatientsParams {
  search?: string;
  branchId?: string;
  branch?: string;
  gender?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedPatientsResponse {
  items: BackendPatient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
