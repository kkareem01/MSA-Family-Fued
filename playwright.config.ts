import { defineConfig, devices } from '@playwright/test';

export const E2E_PORT = 3999;
export const E2E_PIN = 'e2e-pin';
const BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `mkdir -p e2e/.tmp && rm -f e2e/.tmp/feud-e2e.db e2e/.tmp/feud-e2e.db-wal e2e/.tmp/feud-e2e.db-shm && HOST_PIN=${E2E_PIN} PORT=${E2E_PORT} DB_PATH=./e2e/.tmp/feud-e2e.db LOG_LEVEL=silent npm start`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
