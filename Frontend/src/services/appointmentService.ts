import { apiClient } from './apiClient';

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

export const appointmentService = {
  /**
   * Search and query appointments with filters and pagination
   * GET /api/v1/appointments
   */
  async getAppointments(query?: QueryAppointmentsDto): Promise<BackendAppointment[]> {
    const response = await apiClient.get<unknown, BackendAppointment[]>('/appointments', { params: query });
    return response;
  },

  /**
   * Retrieve today's active waiting room triage queue
   * GET /api/v1/appointments/queue/today
   */
  async getTodayQueue(branchId?: string, doctorId?: string, allStatuses: boolean = false): Promise<BackendAppointment[]> {
    const response = await apiClient.get<unknown, BackendAppointment[]>('/appointments/queue/today', {
      params: { branchId, doctorId, allStatuses },
    });
    return response;
  },

  /**
   * Retrieve appointment details by ID
   * GET /api/v1/appointments/:id
   */
  async getAppointment(id: string): Promise<BackendAppointment> {
    const response = await apiClient.get<unknown, BackendAppointment>(`/appointments/${id}`);
    return response;
  },

  /**
   * Schedule a new outpatient doctor appointment
   * POST /api/v1/appointments
   */
  async createAppointment(dto: CreateAppointmentDto): Promise<BackendAppointment> {
    const response = await apiClient.post<unknown, BackendAppointment>('/appointments', dto);
    return response;
  },

  /**
   * Mark patient as checked-in at the clinic reception desk
   * PATCH /api/v1/appointments/:id/check-in
   */
  async checkIn(id: string): Promise<BackendAppointment> {
    const response = await apiClient.patch<unknown, BackendAppointment>(`/appointments/${id}/check-in`);
    return response;
  },

  /**
   * Update appointment status (Scheduled, Checked-in, In Progress, Completed, Cancelled, No-show)
   * PATCH /api/v1/appointments/:id/status
   */
  async updateStatus(id: string, status: string): Promise<BackendAppointment> {
    const response = await apiClient.patch<unknown, BackendAppointment>(`/appointments/${id}/status`, { status });
    return response;
  },

  /**
   * Reschedule or modify appointment details
   * PATCH /api/v1/appointments/:id
   */
  async updateAppointment(id: string, dto: Partial<CreateAppointmentDto>): Promise<BackendAppointment> {
    const response = await apiClient.patch<unknown, BackendAppointment>(`/appointments/${id}`, dto);
    return response;
  },
};
