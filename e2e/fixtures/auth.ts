import { test as base, expect, type Page } from '@playwright/test';
import { ROLE_ACCOUNTS, credentialsFor } from '../../config/users';

// One account per role from the shared roster (config/users.json). `RoleName` is the contract
// the specs use; the real role strings stay in the API (common/constants once ARCH-01a exists).
export type RoleName = keyof typeof ROLE_ACCOUNTS;

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3001/api';

export async function loginAs(page: Page, role: RoleName) {
  const res = await page.request.post(`${API_URL}/auth/login`, { data: credentialsFor(ROLE_ACCOUNTS[role]) });
  expect(res.ok(), `login as ${role} failed: HTTP ${res.status()}`).toBeTruthy();
  const { accessToken, user } = await res.json();
  await page.addInitScript(
    ([token, record]) => {
      localStorage.setItem('hs_token', token);
      localStorage.setItem('hs_user', record);
    },
    [accessToken, JSON.stringify(user)],
  );
  return { token: accessToken as string, user };
}

type Fixtures = { as: (role: RoleName) => Promise<{ token: string; user: unknown }> };

export const test = base.extend<Fixtures>({
  as: async ({ page }, use) => {
    await use((role) => loginAs(page, role));
  },
});

export { expect };
