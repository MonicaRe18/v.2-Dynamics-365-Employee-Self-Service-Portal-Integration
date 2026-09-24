/**
 * Microsoft Dynamics 365 Disciplinary Actions & Penalties Integration API
 * Handles Disciplinary Decisions, Penalties records, and Grievance submissions
 * Maps to D365 OData:
 * - /data/DisciplinaryActions
 * - /data/DisciplinaryGrievances
 */

import { apiClient, ApiResponse } from './apiClient';
import { authService } from '../authService';
import { Penalty, Grievance } from '../../types/d365.types';

export class PenaltyApi {
  /**
   * Fetches official penalties and disciplinary actions
   * D365 OData: GET /data/DisciplinaryActions?$filter=WorkerPersonnelNumber eq '{id}'
   */
  public async getPenalties(
    personnelNumber?: string
  ): Promise<ApiResponse<Penalty[]>> {
    const id = personnelNumber || authService.getCurrentUser()?.id || '';
    const query = id ? `?workerId=${encodeURIComponent(id)}` : '';
    return apiClient.get<Penalty[]>(`/penalties${query}`);
  }

  /**
   * Submits a formal grievance against a disciplinary action
   * D365 OData: POST /data/DisciplinaryGrievances
   */
  public async submitGrievance(
    grievanceData: Omit<Grievance, 'id' | 'submissionDate' | 'status' | 'statusAr'>
  ): Promise<ApiResponse<Grievance>> {
    return apiClient.post<Grievance>('/penalties/grievance', grievanceData);
  }
}

export const penaltyApi = new PenaltyApi();
