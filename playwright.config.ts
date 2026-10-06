import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas E2E sobre la exportación estática (`./out`), servida como en
 * GitHub Pages. Requieren `npm run build` antes de `npm run test:e2e`.
 * No consumen cuota de la API: los flujos parten de un JSON importado.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/youtube-playlist-analyzer/`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node e2e/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/youtube-playlist-analyzer/`,
    reuseExistingServer: !process.env.CI,
  },
});
