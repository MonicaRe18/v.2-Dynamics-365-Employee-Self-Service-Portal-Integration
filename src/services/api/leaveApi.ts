/**
 * Microsoft Dynamics 365 Leave and Absence Integration API
 * Handles Leave Balances, Requests, Transactions, and Substitute Delegates
 * Maps to D365 OData:
 * - /data/LeaveAndAbsenceBankTransactions
 * - /data/EssLeaveRequestHeaders and /data/EssLeaveRequestDetails
 * - /data/LeaveAndAbsencePlans
 */

import { apiClient, ApiResponse } from './apiClient';
import { authService } from '../authService';
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
    personnelNumber?: string
  ): Promise<ApiResponse<LeaveBalance[]>> {
    const id = personnelNumber || authService.getCurrentUser()?.id || '';
    const query = id ? `?workerId=${encodeURIComponent(id)}` : '';
    type BackendBalance = Partial<LeaveBalance> & {
      totalEntitlement?: number;
      transferredFromPreviousYear?: number;
      usedDays?: number;
      remainingBalance?: number;
      pendingApprovalDays?: number;
    };
    const response = await apiClient.get<BackendBalance[]>(`/leave-balances${query}`);
    if (!response.isSuccess || !Array.isArray(response.data)) {
      return response as ApiResponse<LeaveBalance[]>;
    }
    return {
      ...response,
      data: response.data.map((balance) => ({
        id: balance.id || '',
        leaveTypeCode: balance.leaveTypeCode || 'ANNUAL',
        leaveTypeTitle: balance.leaveTypeTitle || '',
        unit: balance.unit || '',
        currentBalance: balance.remainingBalance ?? balance.currentBalance ?? 0,
        allocatedBalance: (balance.totalEntitlement ?? balance.allocatedBalance ?? 0) + (balance.transferredFromPreviousYear ?? 0),
        consumedBalance: balance.usedDays ?? balance.consumedBalance ?? 0,
        pendingBalance: balance.pendingApprovalDays ?? balance.pendingBalance ?? 0,
        accrualRate: balance.accrualRate || '',
        asOfDate: balance.asOfDate || '',
        accrualPlanId: balance.accrualPlanId || '',
      })),
    };
  }

  /**
   * Fetches leave movement history transactions (accruals, consumptions, adjustments)
   */
  public async getLeaveTransactions(
    leaveTypeCode?: LeaveTypeCode,
    personnelNumber?: string
  ): Promise<ApiResponse<LeaveMovementTransaction[]>> {
    const id = personnelNumber || authService.getCurrentUser()?.id || '';
    const query = new URLSearchParams();
    if (id) {
      query.set('workerId', id);
    }
    if (leaveTypeCode) {
      query.set('typeCode', leaveTypeCode);
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<LeaveMovementTransaction[]>(`/leave-transactions${queryString}`);
  }

  /**
   * Fetches submitted leave requests
   * D365 OData: GET /data/LeaveAndAbsenceRequests?$filter=WorkerPersonnelNumber eq '{id}'
   */
  public async getLeaveRequests(
    personnelNumber?: string
  ): Promise<ApiResponse<LeaveRequest[]>> {
    const id = personnelNumber || authService.getCurrentUser()?.id || '';
    const query = id ? `?workerId=${encodeURIComponent(id)}` : '';
    return apiClient.get<LeaveRequest[]>(`/leave-requests${query}`);
  }

  /**
   * Fetches eligible substitute / delegated employees for delegation
   */
  public async getDelegatedEmployees(): Promise<ApiResponse<DelegatedEmployee[]>> {
    return apiClient.get<DelegatedEmployee[]>('/delegated-employees');
  }

  /**
   * Submits a new leave request to Dynamics 365 workflow
   * Backend creates an EssLeaveRequestHeader and dated details, then calls submit.
   */
  public async submitLeaveRequest(
    requestData: Omit<LeaveRequest, 'id' | 'submissionDate' | 'status' | 'statusAr'>
  ): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>('/leave-requests', requestData);
  }

  public async submitSavedLeaveRequest(requestId: string): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`/leave-requests/${encodeURIComponent(requestId)}/submit`);
  }

  /**
   * Cancels a pending leave request
   */
  public async cancelLeaveRequest(requestId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`/leave-requests/${encodeURIComponent(requestId)}`);
  }
}

export const leaveApi = new LeaveApi();
