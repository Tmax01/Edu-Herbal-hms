import { apiClient } from './apiClient';

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

export const patientService = {
  /**
   * Search and query patients with full-text filter, branch filter, and pagination
   * GET /api/v1/patients
   */
  async getPatients(params?: QueryPatientsParams): Promise<PaginatedPatientsResponse | BackendPatient[]> {
    const response = await apiClient.get<unknown, PaginatedPatientsResponse | BackendPatient[]>('/patients', {
      params,
    });
    return response;
  },

  /**
   * Retrieve comprehensive patient profile, EMR history, vitals, and allergies
   * GET /api/v1/patients/:id
   */
  async getPatient(id: string): Promise<BackendPatient> {
    const response = await apiClient.get<unknown, BackendPatient>(`/patients/${id}`);
    return response;
  },

  /**
   * Register a new patient with auto-generated MRN, emergency contacts & allergies
   * POST /api/v1/patients
   */
  async createPatient(payload: CreatePatientPayload): Promise<BackendPatient> {
    const response = await apiClient.post<unknown, BackendPatient>('/patients', payload);
    return response;
  },

  /**
   * Update patient demographic information
   * PATCH /api/v1/patients/:id
   */
  async updatePatient(id: string, payload: Partial<CreatePatientPayload>): Promise<BackendPatient> {
    const response = await apiClient.patch<unknown, BackendPatient>(`/patients/${id}`, payload);
    return response;
  },

  /**
   * Append an emergency contact to a patient
   * POST /api/v1/patients/:id/emergency-contacts
   */
  async addEmergencyContact(id: string, contact: EmergencyContact): Promise<BackendPatient> {
    const response = await apiClient.post<unknown, BackendPatient>(`/patients/${id}/emergency-contacts`, contact);
    return response;
  },

  /**
   * Record a clinical allergy or drug reaction for a patient
   * POST /api/v1/patients/:id/allergies
   */
  async addAllergy(id: string, allergy: PatientAllergy): Promise<BackendPatient> {
    const response = await apiClient.post<unknown, BackendPatient>(`/patients/${id}/allergies`, allergy);
    return response;
  },

  /**
   * Schedule a patient review / follow-up visit
   * POST /api/v1/patients/:id/follow-ups
   */
  async scheduleFollowUp(id: string, followUp: { dueDate: string; notes?: string; condition?: string }): Promise<any> {
    const response = await apiClient.post<unknown, any>(`/patients/${id}/follow-ups`, followUp);
    return response;
  },
};
