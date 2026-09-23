/**
 * Microsoft Dynamics 365 Employee Integration API
 * Communicates with HCM Worker & ESS Profile Endpoints
 */

import { apiClient, ApiResponse } from './apiClient';
import {
  Employee,
  PerformanceEvaluation,
  MonitoringOperation,
  MonitoringRequestStatus,
  MonitoringAttachment,
  D365Notification,
} from '../../types/d365.types';

export class EmployeeApi {
  /**
   * Fetches employee profile by personnel number or current authenticated worker
   * D365 OData: GET /data/Employees(WorkerPersonnelNumber='{id}')
   */
  public async getEmployee(personnelNumber: string = 'EMP-10492'): Promise<ApiResponse<Employee>> {
    return apiClient.get<Employee>(`/employees/${encodeURIComponent(personnelNumber)}`);
  }

  /**
   * Updates employee profile data
   * D365 OData: PATCH /data/Employees(WorkerPersonnelNumber='{id}')
   */
  public async updateEmployee(
    personnelNumber: string,
    updates: Partial<Employee>
  ): Promise<ApiResponse<Employee>> {
    return apiClient.put<Employee>(`/employees/${encodeURIComponent(personnelNumber)}`, updates);
  }

  /**
   * Fetches annual performance evaluations
   * D365 OData: GET /data/HcmPerformanceGoals?$filter=WorkerPersonnelNumber eq '{id}'
   */
  public async getPerformanceEvaluations(
    personnelNumber: string = 'EMP-10492'
  ): Promise<ApiResponse<PerformanceEvaluation[]>> {
    return apiClient.get<PerformanceEvaluation[]>(
      `/performance-evaluations?workerId=${encodeURIComponent(personnelNumber)}`
    );
  }

  /**
   * Fetches monitoring & compliance operations (Financial Disclosures & Medical Tests)
   */
  public async getMonitoringOperations(
    personnelNumber: string = 'EMP-10492'
  ): Promise<ApiResponse<MonitoringOperation[]>> {
    return apiClient.get<MonitoringOperation[]>(
      `/monitoring-operations?workerId=${encodeURIComponent(personnelNumber)}`
    );
  }

  /**
   * Submits a financial disclosure declaration
   */
  public async submitFinancialDisclosure(payload: {
    workerId: string;
    disclosureType: string;
    filingYear: number;
    submissionDate: string;
    declaredAssetsValue?: number;
    declaredLiabilitiesValue?: number;
    hasRealEstate: boolean;
    hasCommercialActivities: boolean;
    notes?: string;
    attachments?: MonitoringAttachment[];
  }): Promise<ApiResponse<MonitoringOperation>> {
    return apiClient.post<MonitoringOperation>('/monitoring-operations/disclosure', payload);
  }

  /**
   * Submits drug & medical test result
   */
  public async submitDrugOrMedicalTest(payload: {
    workerId: string;
    testDate: string;
    sampleType: string;
    medicalFacility: string;
    notes?: string;
    attachments?: MonitoringAttachment[];
  }): Promise<ApiResponse<MonitoringOperation>> {
    return apiClient.post<MonitoringOperation>('/monitoring-operations/test', payload);
  }

  /**
   * Updates compliance request status
   */
  public async updateMonitoringRequestStatus(
    requestId: string,
    nextStatus: MonitoringRequestStatus,
    note?: string
  ): Promise<ApiResponse<MonitoringOperation>> {
    return apiClient.post<MonitoringOperation>(
      `/monitoring-operations/${encodeURIComponent(requestId)}/status`,
      { status: nextStatus, note }
    );
  }

  /**
   * Fetches notifications
   */
  public async getNotifications(
    personnelNumber: string = 'EMP-10492'
  ): Promise<ApiResponse<D365Notification[]>> {
    return apiClient.get<D365Notification[]>(
      `/notifications?workerId=${encodeURIComponent(personnelNumber)}`
    );
  }
}

export const employeeApi = new EmployeeApi();
