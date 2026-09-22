import { apiClient } from '@/api/http.js';
import { authStore } from '@/lib/authStore.js';

function publicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safe } = user;
  return safe;
}

export const authService = {
  async login(email, password, options = {}) {
    const data = await apiClient.post('auth/login', { email, password });
    authStore.save(data.accessToken, publicUser(data.user), { remember: options.remember !== false });
    return { success: true, user: publicUser(data.user) };
  },

  async logout() {
    if (authStore.token) {
      try {
        await apiClient.post('auth/logout', {}, { token: authStore.token });
      } catch { /* sesión local igual se limpia */ }
    }
    authStore.clear();
  },

  getCurrentUser() {
    return authStore.record;
  },

  isAuthenticated() {
    return authStore.isValid;
  },

  async listUsers() {
    const rows = await apiClient.get('users', { token: authStore.token });
    return (rows || []).map(publicUser);
  },

  async requestPasswordReset(email) {
    await apiClient.post('auth/forgot-password', { email });
    return true;
  },

  publicUser,
};

export default authService;
