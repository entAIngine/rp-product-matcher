const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8001',
    headless: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'python3 -m http.server 8001',
    url: 'http://127.0.0.1:8001/docs/index.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
