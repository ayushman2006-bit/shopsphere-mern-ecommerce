import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a live ShopSphere stack:
 *   backend  -> http://localhost:5000
 *   frontend -> http://localhost:5173 (Vite proxies /api and /uploads)
 *
 * Start MongoDB, the API and the Vite dev server first, then run:
 *   npm run test:e2e
 *
 * Override the frontend URL with E2E_BASE_URL when testing a preview build.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
});
