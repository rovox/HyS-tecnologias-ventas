/** Mock authentication. Demo-only — not NestJS JWT. */

import mockAdapter from '@/api/mockAdapter.js';
import { list } from '@/mocks/store.js';
import { DEMO_PASSWORD } from '@/mocks/users.js';

function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

export const authService = {
  async login(email, password) {
    const authData = await mockAdapter.collection('users').authWithPassword(email, password);
    return { success: true, user: authData.record };
  },

  logout() {
    mockAdapter.authStore.clear();
  },

  getCurrentUser() {
    return mockAdapter.authStore.record;
  },

  isAuthenticated() {
    return mockAdapter.authStore.isValid;
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
    await mockAdapter.collection('users').requestPasswordReset(email);
    return true;
  },

  publicUser,
};

export default authService;
