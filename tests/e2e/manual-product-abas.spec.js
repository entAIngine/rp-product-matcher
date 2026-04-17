/**
 * Manual product add + ABAS CSV export tests.
 *
 * Strategy:
 *   - Load results via JSON mode (5 items, no API key needed).
 *   - Test that _CATALOG_DATA is embedded and accessible.
 *   - Click the + button on item 090050, search for a known article (ZAW519CC-AZ).
 *   - Verify the manual column appears with the article number and no score bar.
 *   - Select the manual product.
 *   - Trigger downloadAbas() via page.evaluate and verify the CSV content.
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const JSON_FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'json-mode-results.json');
const jsonFixture = fs.readFileSync(JSON_FIXTURE_PATH, 'utf8');

// Known catalog article and its expected ABAS-ID (from product-catalog.csv)
const TEST_ARTICLE = 'ZAW519CC-AZ';
const TEST_ABAS_ID = '(64328,2,0)';

// positionsnummer of first fixture item — also expected as OZ in ABAS CSV
const TEST_POSITION = '090050';

async function loadJsonMode(page) {
  await page.goto('/docs/index.html');
  await page.locator('[data-mode="json"]').click();
  await page.locator('#json-paste').fill(jsonFixture);
  await page.locator('#btn-parse-json').click();
  await expect(page.locator('#section-results')).toHaveClass(/active/);
  await expect(page.locator('.item-card')).toHaveCount(5);
}

// ─── Catalog data embedded ───────────────────────────────────────────────────

test('_CATALOG_DATA is embedded with 2000+ entries', async ({ page }) => {
  await page.goto('/docs/index.html');
  const count = await page.evaluate(() => {
    return typeof _CATALOG_DATA !== 'undefined' ? _CATALOG_DATA.length : -1;
  });
  expect(count).toBeGreaterThan(2000);
});

test('_CATALOG_DATA contains ZAW519CC-AZ with correct ABAS-ID', async ({ page }) => {
  await page.goto('/docs/index.html');
  const entry = await page.evaluate(() => {
    if (typeof _CATALOG_DATA === 'undefined') return null;
    return _CATALOG_DATA.find(([art]) => art === 'ZAW519CC-AZ') || null;
  });
  expect(entry).not.toBeNull();
  expect(entry[0]).toBe('ZAW519CC-AZ');
  expect(entry[1]).toBe('(64328,2,0)');
});

test('loadCatalog() populates state.catalog.byArticle synchronously', async ({ page }) => {
  await loadJsonMode(page);
  const result = await page.evaluate(() => {
    window.loadCatalog();
    const row = window.state.catalog?.byArticle['ZAW519CC-AZ'];
    return row ? { art: row['Artikelnummer'], abas: row['ABAS-ID'] } : null;
  });
  expect(result).not.toBeNull();
  expect(result.art).toBe('ZAW519CC-AZ');
  expect(result.abas).toBe('(64328,2,0)');
});

// ─── + button and manual column ─────────────────────────────────────────────

test('+ button exists in matrix after results load', async ({ page }) => {
  await loadJsonMode(page);
  // Verify the + button is rendered in the DOM (first card starts open)
  const addBtn = page.locator('.item-card').first().locator('.add-product-btn').first();
  // Scroll the overflow table to reveal the button
  await page.evaluate(() => {
    const wrapper = document.querySelector('.item-card.open .matrix-wrapper');
    if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
  });
  await expect(addBtn).toBeVisible();
});

test('clicking + opens search popover with input', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();
  const addBtn = firstCard.locator('.add-product-btn').first();
  await addBtn.scrollIntoViewIfNeeded();
  await addBtn.click();
  await expect(page.locator('#add-product-popover')).toBeVisible();
  await expect(page.locator('.catalog-search-input')).toBeVisible();
});

test('typing ZAW in popover shows matching results', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();
  await firstCard.locator('.add-product-btn').first().click();
  await page.locator('.catalog-search-input').fill('ZAW');
  await expect(page.locator('.catalog-result-item').first()).toBeVisible();
});

test('selecting ZAW519CC-AZ adds manual column to matrix', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();
  await firstCard.locator('.add-product-btn').first().click();
  await page.locator('.catalog-search-input').fill('ZAW519CC-AZ');
  await expect(page.locator('.catalog-result-item').first()).toBeVisible();
  await page.locator('.catalog-result-item').first().click();

  // Popover should close
  await expect(page.locator('#add-product-popover')).not.toBeVisible();

  // Manual column header should appear with article number
  await expect(firstCard.locator('.ph-manual-badge')).toBeVisible();
  await expect(firstCard.locator('.col-manual .ph-article')).toContainText('ZAW519CC-AZ');
});

test('manual column has no score bar', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();
  await firstCard.locator('.add-product-btn').first().click();
  await page.locator('.catalog-search-input').fill('ZAW519CC-AZ');
  await page.locator('.catalog-result-item').first().click();

  // col-manual should NOT contain a score bar
  const manualTh = firstCard.locator('.col-manual');
  await expect(manualTh.locator('.ph-score-row')).toHaveCount(0);
});

test('manual column select button marks column as selected', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();
  await firstCard.locator('.add-product-btn').first().click();
  await page.locator('.catalog-search-input').fill('ZAW519CC-AZ');
  await page.locator('.catalog-result-item').first().click();
  await expect(page.locator('#add-product-popover')).not.toBeVisible();

  // Click the select button — re-query after rerenderMatrix replaced the DOM
  await page.locator('.item-card').first().locator('.col-manual .ph-select-btn').click();

  // Column header should gain is-selected class
  await expect(page.locator('.item-card').first().locator('.col-manual')).toHaveClass(/is-selected/);

  // state.selections for this item should be 'manual:0'
  const sel = await page.evaluate(() => window.state.selections['090050']);
  expect(sel).toBe('manual:0');
});

test('adding same article twice does not create duplicate column', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();

  // Add once
  await firstCard.locator('.add-product-btn').first().click();
  await page.locator('.catalog-search-input').fill('ZAW519CC-AZ');
  await page.locator('.catalog-result-item').first().click();

  // Add again
  await firstCard.locator('.add-product-btn').first().click();
  await page.locator('.catalog-search-input').fill('ZAW519CC-AZ');
  await page.locator('.catalog-result-item').first().click();

  const manualCols = await firstCard.locator('.col-manual').count();
  expect(manualCols).toBe(1);
});

test('Escape key closes the popover', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();
  await firstCard.locator('.add-product-btn').first().click();
  await expect(page.locator('#add-product-popover')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#add-product-popover')).not.toBeVisible();
});

// ─── ABAS CSV content ────────────────────────────────────────────────────────

test('downloadAbas() produces correct OZ;ABAS-ID; CSV for manually selected product', async ({ page }) => {
  await loadJsonMode(page);
  const firstCard = page.locator('.item-card').first();

  // Add ZAW519CC-AZ as manual product on item 090050
  await firstCard.locator('.add-product-btn').first().click();
  await page.locator('.catalog-search-input').fill('ZAW519CC-AZ');
  await page.locator('.catalog-result-item').first().click();

  // Select it
  await firstCard.locator('.col-manual .ph-select-btn').click();

  // Call downloadAbas and capture the CSV content via evaluate
  const csvContent = await page.evaluate(() => {
    // Intercept Blob creation to capture content
    const originalBlob = window.Blob;
    let captured = null;
    window.Blob = function(parts, opts) {
      captured = parts[0];
      window.Blob = originalBlob;
      return new originalBlob(parts, opts);
    };
    // Also intercept click so it doesn't navigate
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = function(tag) {
      const el = originalCreateElement(tag);
      if (tag === 'a') { el.click = () => {}; }
      return el;
    };
    window.downloadAbas();
    document.createElement = originalCreateElement;
    return captured;
  });

  expect(csvContent).toBeTruthy();
  const lines = csvContent.trim().split('\n');
  expect(lines[0]).toBe('OZ;ABAS-ID;');

  // Find the line for position 090050
  const posLine = lines.find(l => l.startsWith('090050;'));
  expect(posLine).toBeTruthy();
  expect(posLine).toBe('090050;(64328,2,0);');
});

test('ABAS CSV OZ uses verbatim positionsnummer (preserves GAEB format)', async ({ page }) => {
  await loadJsonMode(page);

  const csvContent = await page.evaluate(() => {
    window.loadCatalog();
    window.state.manualProducts['090050'] = [{ 'Artikelnummer': 'ZAW519CC-AZ', 'ABAS-ID': '(64328,2,0)' }];
    window.state.selections['090050'] = 'manual:0';

    const originalBlob = window.Blob;
    let captured = null;
    window.Blob = function(parts, opts) { captured = parts[0]; window.Blob = originalBlob; return new originalBlob(parts, opts); };
    const origCreate = document.createElement.bind(document);
    document.createElement = (t) => { const e = origCreate(t); if (t === 'a') e.click = () => {}; return e; };
    window.downloadAbas();
    document.createElement = origCreate;
    return captured;
  });

  expect(csvContent).toBeTruthy();
  const lines = csvContent.trim().split('\n');
  expect(lines[0]).toBe('OZ;ABAS-ID;');

  // OZ must be the verbatim positionsnummer from the fixture ('090050')
  const posLine = lines.find(l => l.startsWith('090050;'));
  expect(posLine).toBeDefined();
  const parts = posLine.split(';');
  expect(parts[1]).toBe('(64328,2,0)');
});

test('ABAS CSV header is exactly OZ;ABAS-ID;', async ({ page }) => {
  await loadJsonMode(page);
  const csvContent = await page.evaluate(() => {
    window.loadCatalog();
    window.state.manualProducts['090050'] = [{ 'Artikelnummer': 'ZAW519CC-AZ', 'ABAS-ID': '(64328,2,0)' }];
    window.state.selections['090050'] = 'manual:0';
    const originalBlob = window.Blob;
    let captured = null;
    window.Blob = function(parts, opts) { captured = parts[0]; window.Blob = originalBlob; return new originalBlob(parts, opts); };
    const origCreate = document.createElement.bind(document);
    document.createElement = (t) => { const e = origCreate(t); if (t === 'a') e.click = () => {}; return e; };
    window.downloadAbas();
    document.createElement = origCreate;
    return captured;
  });
  const firstLine = csvContent.trim().split('\n')[0];
  expect(firstLine).toBe('OZ;ABAS-ID;');
});

test('downloadAbas() uses abas_id from proposal JSON, not catalog lookup', async ({ page }) => {
  await loadJsonMode(page);
  const csvContent = await page.evaluate(() => {
    window.loadCatalog();
    // Inject an abas_id onto a proposal whose display_article is NOT in the catalog,
    // so the only way to get this ABAS-ID into the CSV is by reading proposal.abas_id directly.
    const item = window.state.results.items[0];
    item.proposals[0].abas_id = '(99999,9,0)';
    item.proposals[0].display_article = '__NOT_IN_CATALOG__';
    item.proposals[0].base_article = '__NOT_IN_CATALOG__';
    Object.keys(window.state.selections).forEach(k => { window.state.selections[k] = null; });
    window.state.selections[item.positionsnummer || item.item_id] = 0;

    const originalBlob = window.Blob;
    let captured = null;
    window.Blob = function(parts, opts) { captured = parts[0]; window.Blob = originalBlob; return new originalBlob(parts, opts); };
    const origCreate = document.createElement.bind(document);
    document.createElement = (t) => { const e = origCreate(t); if (t === 'a') e.click = () => {}; return e; };
    window.downloadAbas();
    document.createElement = origCreate;
    return captured;
  });

  const lines = csvContent.trim().split('\n').filter(l => l.trim());
  expect(lines[0]).toBe('OZ;ABAS-ID;');
  const posLine = lines.find(l => l.startsWith(`${TEST_POSITION};`));
  expect(posLine).toBe(`${TEST_POSITION};(99999,9,0);`);
});

test('downloadAbas() falls back to catalog when proposal lacks abas_id', async ({ page }) => {
  await loadJsonMode(page);
  const csvContent = await page.evaluate(() => {
    window.loadCatalog();
    const item = window.state.results.items[0];
    // Simulate an older response: no abas_id, but display_article is a known catalog article.
    delete item.proposals[0].abas_id;
    item.proposals[0].display_article = 'ZAW519CC-AZ';
    Object.keys(window.state.selections).forEach(k => { window.state.selections[k] = null; });
    window.state.selections[item.positionsnummer || item.item_id] = 0;

    const originalBlob = window.Blob;
    let captured = null;
    window.Blob = function(parts, opts) { captured = parts[0]; window.Blob = originalBlob; return new originalBlob(parts, opts); };
    const origCreate = document.createElement.bind(document);
    document.createElement = (t) => { const e = origCreate(t); if (t === 'a') e.click = () => {}; return e; };
    window.downloadAbas();
    document.createElement = origCreate;
    return captured;
  });

  const lines = csvContent.trim().split('\n').filter(l => l.trim());
  const posLine = lines.find(l => l.startsWith(`${TEST_POSITION};`));
  expect(posLine).toBe(`${TEST_POSITION};${TEST_ABAS_ID};`);
});

test('ABAS CSV only includes positions with a selection (skips unselected)', async ({ page }) => {
  await loadJsonMode(page);
  const csvContent = await page.evaluate(() => {
    window.loadCatalog();
    // Select only item 090050 (manual), leave all others null
    Object.keys(window.state.selections).forEach(k => { window.state.selections[k] = null; });
    window.state.manualProducts['090050'] = [{ 'Artikelnummer': 'ZAW519CC-AZ', 'ABAS-ID': '(64328,2,0)' }];
    window.state.selections['090050'] = 'manual:0';
    const originalBlob = window.Blob;
    let captured = null;
    window.Blob = function(parts, opts) { captured = parts[0]; window.Blob = originalBlob; return new originalBlob(parts, opts); };
    const origCreate = document.createElement.bind(document);
    document.createElement = (t) => { const e = origCreate(t); if (t === 'a') e.click = () => {}; return e; };
    window.downloadAbas();
    document.createElement = origCreate;
    return captured;
  });
  const lines = csvContent.trim().split('\n').filter(l => l.trim());
  // Only header + 1 data row
  expect(lines.length).toBe(2);
  expect(lines[0]).toBe('OZ;ABAS-ID;');
  expect(lines[1]).toBe('090050;(64328,2,0);');
});
