import { defineConfig, devices } from '@playwright/test';

// LOCAL-02: runs against the local stack started by `pnpm local:up` (never Hostinger).
// Specs live in e2e/ and are added per phase: the route sweep (AN-01) and one
// create/edit/delete refresh test per CRUD (FE-02b).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_WEB_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
