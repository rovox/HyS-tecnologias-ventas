import apiClient from '@/api/client.js';
import { authStore } from '@/lib/authStore.js';

export const authToken = () => authStore.token;

export { apiClient };
