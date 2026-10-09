import { apiClient } from './apiClient';
import { LeaveRequest, OffDutyRequest, HrOverview, CreateLeaveRequestDto, ApproveLeaveRequestDto, CreateOffDutyRequestDto, ApproveOffDutyDto, QueryHrDto } from '../types/hr';

export const hrService = {
  /**
   * Retrieve HR module dashboard overview statistics and counts
   */
  async getOverview(branchId?: string): Promise<HrOverview> {
    const params: Record<string, any> = {};
    if (branchId && branchId !== 'All') params.branchId = branchId;
    return await apiClient.get('/hr/overview', { params });
  },

  /**
   * Submit a staff leave application
   */
  async createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    return await apiClient.post('/hr/leave-requests', dto);
  },

  /**
   * Approve or reject a staff leave application
   */
  async approveLeaveRequest(id: string, dto: ApproveLeaveRequestDto): Promise<LeaveRequest> {
    return await apiClient.patch(`/hr/leave-requests/${id}/status`, dto);
  },

  /**
   * Query staff leave applications with status and branch filters
   */
  async getLeaveRequests(query?: QueryHrDto): Promise<LeaveRequest[]> {
    return await apiClient.get('/hr/leave-requests', { params: query });
  },

  /**
   * Submit a shift swap or off-duty scheduling request
   */
  async createOffDutyRequest(dto: CreateOffDutyRequestDto): Promise<OffDutyRequest> {
    return await apiClient.post('/hr/off-duty-requests', dto);
  },

  /**
   * Approve or reject an off-duty shift request
   */
  async approveOffDutyRequest(id: string, dto: ApproveOffDutyDto): Promise<OffDutyRequest> {
    return await apiClient.patch(`/hr/off-duty-requests/${id}/status`, dto);
  },

  /**
   * Query staff off-duty requests
   */
  async getOffDutyRequests(query?: QueryHrDto): Promise<OffDutyRequest[]> {
    return await apiClient.get('/hr/off-duty-requests', { params: query });
  },
};

export default hrService;
