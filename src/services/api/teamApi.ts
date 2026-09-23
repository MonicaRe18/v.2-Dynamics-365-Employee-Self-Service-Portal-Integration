/**
 * Microsoft Dynamics 365 Manager Self-Service (MSS) Team Integration API
 * Handles Team Members, Direct Reports, Subordinate Leave/Absence Requests,
 * Approval/Rejection Actions, and Submissions on Behalf of Employees.
 */

import { apiClient, ApiResponse } from './apiClient';
import { TeamMember, TeamMemberRequest } from '../../types/d365.types';

export class TeamApi {
  /**
   * Fetches direct report team members for manager self-service
   * D365 OData: GET /data/PositionWorkerAssignments?$filter=ReportsToPosition eq '{pos}'
   */
  public async getTeamMembers(
    managerPersonnelNumber: string = 'EMP-10000'
  ): Promise<ApiResponse<TeamMember[]>> {
    return apiClient.get<TeamMember[]>(
      `/team-members?managerId=${encodeURIComponent(managerPersonnelNumber)}`
    );
  }

  /**
   * Approves a subordinate's pending request
   */
  public async approveTeamRequest(
    requestId: string,
    notes?: string
  ): Promise<ApiResponse<TeamMemberRequest>> {
    return apiClient.post<TeamMemberRequest>(
      `/team-requests/${encodeURIComponent(requestId)}/approve`,
      { notes }
    );
  }

  /**
   * Rejects a subordinate's pending request
   */
  public async rejectTeamRequest(
    requestId: string,
    reason: string
  ): Promise<ApiResponse<TeamMemberRequest>> {
    return apiClient.post<TeamMemberRequest>(
      `/team-requests/${encodeURIComponent(requestId)}/reject`,
      { reason }
    );
  }

  /**
   * Submits a leave request on behalf of a team member
   */
  public async submitLeaveOnBehalf(
    memberId: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    days: number,
    notes?: string
  ): Promise<ApiResponse<TeamMemberRequest>> {
    return apiClient.post<TeamMemberRequest>('/team-requests/on-behalf/leave', {
      memberId,
      leaveType,
      startDate,
      endDate,
      days,
      notes,
    });
  }

  /**
   * Submits an absence permission on behalf of a team member
   */
  public async submitAbsenceOnBehalf(
    memberId: string,
    duration: string,
    date: string,
    reason: string
  ): Promise<ApiResponse<TeamMemberRequest>> {
    return apiClient.post<TeamMemberRequest>('/team-requests/on-behalf/absence', {
      memberId,
      duration,
      date,
      reason,
    });
  }
}

export const teamApi = new TeamApi();
