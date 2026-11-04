import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4173', channel: 'msedge', headless: true, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'node scripts/security-preview.mjs', url: 'http://localhost:4173', reuseExistingServer: false, timeout: 60000 },
})
