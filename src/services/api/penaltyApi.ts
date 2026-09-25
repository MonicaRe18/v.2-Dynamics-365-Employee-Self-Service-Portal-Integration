/**
 * Microsoft Dynamics 365 Disciplinary Actions & Penalties Integration API
 * Handles Disciplinary Decisions, Penalties records, and Grievance submissions
 * Reads penalties through the ESS backend's PAR_Penalties service.
 */

import { apiClient, ApiResponse } from './apiClient';
import { Penalty, Grievance } from '../../types/d365.types';

export class PenaltyApi {
  /**
   * Fetches official penalties and disciplinary actions
   * The backend uses the signed-in worker's identity.
   */
  public async getPenalties(): Promise<ApiResponse<Penalty[]>> {
    return apiClient.get<Penalty[]>('/penalties');
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
