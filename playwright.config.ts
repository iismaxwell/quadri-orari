import { defineConfig, devices } from '@playwright/test';

// Test end-to-end sul sito già costruito: prima `npm run build`, poi `npx playwright test`.
// I file sono tests/e2e/*.spec.ts; Vitest li ignora.
const porta = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.spec.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${porta}/quadri-orari/`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // --ignore-lock: un server di anteprima già aperto a mano non blocca quello dei test.
    command: `npx astro preview --port ${porta} --ignore-lock`,
    url: `http://localhost:${porta}/quadri-orari/`,
    reuseExistingServer: false,
  },
});
