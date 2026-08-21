/** Authentication. Mock store in POC; NestJS JWT when VITE_API_MODE=api. */

import mockAdapter from '@/api/mockAdapter.js';
import { list } from '@/mocks/store.js';
import { DEMO_PASSWORD } from '@/mocks/users.js';
import { isMockMode, apiClient } from '@/api/http.js';

function publicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safe } = user;
  return safe;
}

export const authService = {
  async login(email, password, options = {}) {
    if (!isMockMode) {
      const data = await apiClient.post('auth/login', { email, password });
      mockAdapter.authStore.save(data.accessToken, publicUser(data.user), { remember: options.remember });
      return { success: true, user: publicUser(data.user) };
    }
    const authData = await mockAdapter.collection('users').authWithPassword(email, password);
    mockAdapter.authStore.save(authData.token, authData.record, { remember: options.remember });
    return { success: true, user: authData.record };
  },

  async logout() {
    if (!isMockMode && mockAdapter.authStore.token) {
      try {
        await apiClient.post('auth/logout', {}, { token: mockAdapter.authStore.token });
      } catch { /* sesión local igual se limpia */ }
    }
    mockAdapter.authStore.clear();
  },

  getCurrentUser() {
    return mockAdapter.authStore.record;
  },

  isAuthenticated() {
    return mockAdapter.authStore.isValid;
  },

  async listUsers() {
    if (!isMockMode) {
      const rows = await apiClient.get('users', { token: mockAdapter.authStore.token });
      return (rows || []).map(publicUser);
    }
    return list('users').map(publicUser);
  },

  listDemoAccounts() {
    return list('users').map((user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      password: DEMO_PASSWORD,
    }));
  },

  async requestPasswordReset(email) {
    if (!isMockMode) {
      await apiClient.post('auth/forgot-password', { email });
      return true;
    }
    await mockAdapter.collection('users').requestPasswordReset(email);
    return true;
  },

  publicUser,
};

export default authService;
