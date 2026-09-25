import { apiClient } from './apiClient';

export const reassignmentApi = {
  getCities() {
    return apiClient.get<{ cityKey: string; name: string }[]>('/reassignment-requests/cities');
  },
  submit(applicationDate: string, newAddress: string, reassignmentType: number, newCityKey: string) {
    return apiClient.post<{ submitted: boolean; assignmentId: string }>('/reassignment-requests', {
      applicationDate,
      newAddress,
      reassignmentType,
      newCityKey,
    });
  },
};
