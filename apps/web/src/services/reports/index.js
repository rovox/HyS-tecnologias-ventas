import { apiClient, authToken } from '@/api/http.js';

export const reportsService = {
  async getSalesMetrics({ userId, month } = {}) {
    return apiClient.get('metrics/sales', { token: authToken(), query: { userId, month } });
  },

  async getSalesActivity({ userId, month } = {}) {
    return apiClient.get('metrics/activity', { token: authToken(), query: { userId, month } });
  },

  async getFeed() {
    return apiClient.get('metrics/feed', { token: authToken() });
  },
};

export default reportsService;
