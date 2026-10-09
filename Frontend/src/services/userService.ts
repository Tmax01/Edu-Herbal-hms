import { apiClient } from './apiClient';
import { StaffUser } from '../types/auth';

export interface CreateUserPayload {
  email: string;
  fullName: string;
  role: string;
  primaryBranchId?: string;
  departmentId?: string;
  phone?: string;
  password?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  role?: string;
  primaryBranchId?: string;
  departmentId?: string;
  phone?: string;
  active?: boolean;
}

export interface QueryUsersPayload {
  role?: string;
  branchId?: string;
  search?: string;
  activeOnly?: boolean;
}

export const userService = {
  /**
   * Register a new staff member account
   */
  async createUser(dto: CreateUserPayload): Promise<StaffUser> {
    return await apiClient.post('/users', dto);
  },

  /**
   * List all hospital staff (filtered by role, branch, or search)
   */
  async getUsers(query?: QueryUsersPayload): Promise<StaffUser[]> {
    const res: any = await apiClient.get('/users', { params: query });
    if (res && Array.isArray(res.items)) {
      return res.items;
    }
    if (Array.isArray(res)) {
      return res;
    }
    return [];
  },

  /**
   * Retrieve staff profile with assigned module permissions
   */
  async getUser(id: string): Promise<StaffUser> {
    return await apiClient.get(`/users/${id}`);
  },

  /**
   * Update staff member profile information
   */
  async updateUser(id: string, dto: UpdateUserPayload): Promise<StaffUser> {
    return await apiClient.patch(`/users/${id}`, dto);
  },

  /**
   * Toggle staff active or inactive status
   */
  async toggleActive(id: string): Promise<StaffUser> {
    return await apiClient.patch(`/users/${id}/toggle-active`);
  },

  /**
   * Reset staff member password
   */
  async resetPassword(id: string, password: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.post(`/users/${id}/reset-password`, { password });
  },

  /**
   * Record and upload staff CV document metadata
   */
  async uploadCv(id: string, fileName: string, dataUrl?: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.post(`/users/${id}/cv`, { fileName, dataUrl });
  },

  /**
   * Generate and record official appointment letter
   */
  async sendAppointmentLetter(
    id: string,
    options?: { effectiveDate?: string; signatoryTitle?: string; customNotes?: string }
  ): Promise<{ success: boolean; appointmentLetterSent: boolean; appointmentLetterDate: string; letterContent: string; message: string }> {
    return await apiClient.post(`/users/${id}/appointment-letter`, options || {});
  },

  /**
   * Configure granular module permissions for staff user
   */
  async setPermissions(id: string, allowedModules: string[]): Promise<StaffUser> {
    return await apiClient.post(`/users/${id}/permissions`, { allowedModules });
  },

  /**
   * Reset staff member module permissions to system default for their role
   */
  async resetPermissionsToDefault(id: string): Promise<StaffUser> {
    return await apiClient.post(`/users/${id}/permissions/reset-default`);
  },
};

export default userService;
