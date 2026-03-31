const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const repoRoot = path.resolve(__dirname, '..', '..');
const envPath = path.join(repoRoot, '.env');
const jsonFixturePath = path.join(repoRoot, 'tests', 'fixtures', 'json-mode-results.json');
const liveUploadCandidatePaths = [
  process.env.ENTAINGINE_TEST_P93_PATH,
  path.join(repoRoot, 'tmp', 'playwright', '1657234.p93'),
  path.join(repoRoot, 'output', 'playwright', 'test-upload.p93'),
].filter(Boolean);

function readDotEnvValue(key) {
  if (!fs.existsSync(envPath)) return '';
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || match[1] !== key) continue;
    return match[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return '';
}

function firstExistingPath(paths) {
  return paths.find(candidate => candidate && fs.existsSync(candidate)) || '';
}

const apiKey = process.env.ENTAINGINE_M2M_API_KEY || readDotEnvValue('ENTAINGINE_M2M_API_KEY');
const uploadFixturePath = firstExistingPath(liveUploadCandidatePaths);
const resumeProcessId = process.env.ENTAINGINE_TEST_PROCESS_ID || '65831';
const jsonFixture = fs.readFileSync(jsonFixturePath, 'utf8');

async function fillPasswordField(page, selector, value) {
  await page.locator(selector).fill(value);
  await expect(page.locator(selector)).toHaveValue(value);
}

test.describe.configure({ mode: 'serial' });

test('API mode starts a live process and persists its route', async ({ page }) => {
  test.skip(!apiKey, 'ENTAINGINE_M2M_API_KEY is required in .env for API-mode E2E coverage.');
  test.skip(!uploadFixturePath, 'No P93 fixture path is available for API-mode E2E coverage.');

  await page.goto('/docs/index.html');
  await fillPasswordField(page, '#api-key-input', apiKey);
  await page.locator('#file-input').setInputFiles(uploadFixturePath);

  await expect(page.locator('#btn-start')).toBeEnabled();
  await page.locator('#btn-start').click();

  await expect(page.locator('#section-processing')).toHaveClass(/active/);
  await page.waitForURL(/process=\d+.*#processing/, { timeout: 120_000 });

  const currentUrl = new URL(page.url());
  const processId = currentUrl.searchParams.get('process');
  expect(processId).toMatch(/^\d+$/);
  await expect(page.locator('#processing-process-pill')).toContainText(processId);
  await expect(page.locator('#task-outputs')).toContainText('Process ID', { timeout: 120_000 });
});

test('JSON mode renders the provided fixture into results', async ({ page }) => {
  await page.goto('/docs/index.html');
  await page.locator('[data-mode="json"]').click();
  await page.locator('#json-paste').fill(jsonFixture);
  await page.locator('#btn-parse-json').click();

  await expect(page.locator('#section-results')).toHaveClass(/active/);
  await expect(page.locator('.item-card')).toHaveCount(5);
  await expect(page.locator('#results-meta')).toContainText('5d60fd40');
  await expect(page.locator('#progress-label')).toContainText('0 / 5');
});

test('Resume mode loads completed results for a known process ID', async ({ page }) => {
  test.skip(!apiKey, 'ENTAINGINE_M2M_API_KEY is required in .env for resume-mode E2E coverage.');

  await page.goto(`/docs/index.html?process=${resumeProcessId}#results`);
  await expect(page.locator('[data-mode="resume"]')).toHaveClass(/active/);
  await expect(page.locator('#resume-process-input')).toHaveValue(resumeProcessId);

  await fillPasswordField(page, '#api-key-resume-input', apiKey);
  await expect(page.locator('#btn-resume')).toBeEnabled();
  await page.locator('#btn-resume').click();

  await expect(page.locator('#section-results')).toHaveClass(/active/, { timeout: 120_000 });
  await expect(page.locator('#results-process-pill')).toContainText(resumeProcessId);
  expect(await page.locator('.item-card').count()).toBeGreaterThan(0);
});
