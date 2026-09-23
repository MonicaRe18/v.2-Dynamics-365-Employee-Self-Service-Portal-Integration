/**
 * Microsoft Dynamics 365 Leave and Absence Integration API
 * Handles Leave Balances, Requests, Transactions, and Substitute Delegates
 * Maps to D365 OData:
 * - /data/LeaveAndAbsenceBankTransactions
 * - /data/LeaveAndAbsenceRequests
 * - /data/LeaveAndAbsencePlans
 */

import { apiClient, ApiResponse } from './apiClient';
import {
  LeaveBalance,
  LeaveMovementTransaction,
  LeaveRequest,
  DelegatedEmployee,
  LeaveTypeCode,
} from '../../types/d365.types';

export class LeaveApi {
  /**
   * Fetches official leave balances
   * D365 OData: GET /data/LeaveAndAbsenceBankTransactions?$filter=WorkerPersonnelNumber eq '{id}'
   */
  public async getLeaveBalances(
    personnelNumber: string = 'EMP-10492'
  ): Promise<ApiResponse<LeaveBalance[]>> {
    return apiClient.get<LeaveBalance[]>(
      `/leave-balances?workerId=${encodeURIComponent(personnelNumber)}`
    );
  }

  /**
   * Fetches leave movement history transactions (accruals, consumptions, adjustments)
   */
  public async getLeaveTransactions(
    leaveTypeCode?: LeaveTypeCode,
    personnelNumber: string = 'EMP-10492'
  ): Promise<ApiResponse<LeaveMovementTransaction[]>> {
    const query = new URLSearchParams({ workerId: personnelNumber });
    if (leaveTypeCode) {
      query.set('typeCode', leaveTypeCode);
    }
    return apiClient.get<LeaveMovementTransaction[]>(`/leave-transactions?${query.toString()}`);
  }

  /**
   * Fetches submitted leave requests
   * D365 OData: GET /data/LeaveAndAbsenceRequests?$filter=WorkerPersonnelNumber eq '{id}'
   */
  public async getLeaveRequests(
    personnelNumber: string = 'EMP-10492'
  ): Promise<ApiResponse<LeaveRequest[]>> {
    return apiClient.get<LeaveRequest[]>(
      `/leave-requests?workerId=${encodeURIComponent(personnelNumber)}`
    );
  }

  /**
   * Fetches eligible substitute / delegated employees for delegation
   */
  public async getDelegatedEmployees(): Promise<ApiResponse<DelegatedEmployee[]>> {
    return apiClient.get<DelegatedEmployee[]>('/delegated-employees');
  }

  /**
   * Submits a new leave request to Dynamics 365 workflow
   * D365 OData: POST /data/LeaveAndAbsenceRequests
   */
  public async submitLeaveRequest(
    requestData: Omit<LeaveRequest, 'id' | 'submissionDate' | 'status' | 'statusAr'>
  ): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>('/leave-requests', requestData);
  }

  /**
   * Cancels a pending leave request
   */
  public async cancelLeaveRequest(requestId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`/leave-requests/${encodeURIComponent(requestId)}`);
  }
}

export const leaveApi = new LeaveApi();
