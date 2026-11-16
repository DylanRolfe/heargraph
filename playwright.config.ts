import { defineConfig, devices } from '@playwright/test';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/$/, '');

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.output',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 7_000 },
  reporter: [['list'], ['json', { outputFile: 'e2e/.output-report/results.json' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
    // Optional extra engine, off by default: `WEBKIT=1 npx playwright test --project=webkit`.
    ...(process.env.WEBKIT
      ? [{ name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } }]
      : []),
  ],
  // When BASE_URL is set the suite runs against that deployment and no local server is started.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'node scripts/serve.mjs 4173',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
