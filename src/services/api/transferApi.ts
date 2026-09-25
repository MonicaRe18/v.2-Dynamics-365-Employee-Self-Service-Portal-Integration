import { apiClient } from './apiClient';

export const transferApi = {
  submit(transferDate: string, transferTo: string) {
    return apiClient.post<{ submitted: boolean; transferId: string }>('/transfer-requests', {
      transferDate,
      transferTo,
    });
  },
};
