import { defineConfig, devices } from '@playwright/test';

const DEV_PORT = 5180;
const PREVIEW_PORT = 5181;
const SUBPATH_PORT = 5182;
/** Wie auf GitHub Pages: App unter einem Unterpfad. */
const SUBPATH = '/eulenzeit/';
// process.execPath: dieselbe Node-Installation wie Playwright selbst (auch das portable .tools/node).
const node = `"${process.execPath}"`;

const touch = (width: number, height: number) => ({ ...devices['Desktop Chrome'], viewport: { width, height }, hasTouch: true });

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${DEV_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'tablet', testIgnore: /(production|subpath)\.spec/, use: touch(768, 1024) },
    { name: 'tablet-landscape', testIgnore: /(production|subpath)\.spec/, use: touch(1024, 768) },
    { name: 'phone', testIgnore: /(production|subpath)\.spec/, use: touch(375, 812) },
    // Gegen den Produktions-Build: CSP, keine fremden Requests, nicht installierbar.
    {
      name: 'subpath',
      testMatch: /subpath\.spec/,
      use: { ...touch(768, 1024), baseURL: `http://localhost:${SUBPATH_PORT}${SUBPATH}` },
    },
    { name: 'production', testMatch: /production\.spec/, use: { ...touch(768, 1024), baseURL: `http://localhost:${PREVIEW_PORT}` } },
  ],
  webServer: [
    {
      command: `${node} node_modules/vite/bin/vite.js --port ${DEV_PORT} --strictPort`,
      url: `http://localhost:${DEV_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `${node} node_modules/vite/bin/vite.js build && ${node} node_modules/vite/bin/vite.js preview --port ${PREVIEW_PORT} --strictPort`,
      url: `http://localhost:${PREVIEW_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: `BASE_PATH=${SUBPATH} ${node} node_modules/vite/bin/vite.js build --outDir dist-subpath && BASE_PATH=${SUBPATH} ${node} node_modules/vite/bin/vite.js preview --outDir dist-subpath --port ${SUBPATH_PORT} --strictPort`,
      url: `http://localhost:${SUBPATH_PORT}${SUBPATH}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
