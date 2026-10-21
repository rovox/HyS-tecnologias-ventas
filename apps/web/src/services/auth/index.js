import { apiClient } from '@/api/http.js';
import { authStore } from '@/lib/authStore.js';

function publicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safe } = user;
  return safe;
}

const authService = {
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

  /** Id, name and role of active users; allowed for every role with access (técnico included). */
  async userDirectory() {
    return (await apiClient.get('users/directory', { token: authStore.token })) || [];
  },

  /** One profile: own, or any for admin/ventas. */
  async getUser(id) {
    return publicUser(await apiClient.get(`users/${id}`, { token: authStore.token }));
  },

  async requestPasswordReset(email) {
    await apiClient.post('auth/forgot-password', { email });
    return true;
  },

  publicUser,
};

export default authService;
