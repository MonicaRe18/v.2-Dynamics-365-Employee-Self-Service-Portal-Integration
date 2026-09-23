/**
 * Microsoft Dynamics 365 Training Courses & Evaluations Integration API
 * Handles Training Courses, Attendance, and Course Impact Evaluations
 * Maps to D365 OData:
 * - /data/CourseAttendances
 * - /data/CourseEvaluations
 */

import { apiClient, ApiResponse } from './apiClient';
import { TrainingCourse, TrainingEvaluation } from '../../types/d365.types';

export class TrainingApi {
  /**
   * Fetches enrolled and completed training courses
   * D365 OData: GET /data/CourseAttendances?$filter=WorkerPersonnelNumber eq '{id}'
   */
  public async getTrainingCourses(
    personnelNumber: string = 'EMP-10492'
  ): Promise<ApiResponse<TrainingCourse[]>> {
    return apiClient.get<TrainingCourse[]>(
      `/training-courses?workerId=${encodeURIComponent(personnelNumber)}`
    );
  }

  /**
   * Submits a formal course evaluation
   * D365 OData: POST /data/CourseEvaluations
   */
  public async submitTrainingEvaluation(
    evaluationData: Omit<TrainingEvaluation, 'id' | 'submissionDate'>
  ): Promise<ApiResponse<TrainingEvaluation>> {
    return apiClient.post<TrainingEvaluation>('/training-courses/evaluation', evaluationData);
  }
}

export const trainingApi = new TrainingApi();
