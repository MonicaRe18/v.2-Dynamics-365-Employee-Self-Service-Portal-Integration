import { apiClient } from './apiClient';

export const secondmentApi = {
  submit(applicationDate: string, borrowingEntity: string) {
    return apiClient.post<{ submitted: boolean; requestId: string }>('/secondment-requests', {
      applicationDate,
      borrowingEntity,
    });
  },
};
