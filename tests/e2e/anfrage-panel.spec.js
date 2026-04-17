/**
 * Anfrage Panel UI validation tests.
 *
 * Strategy:
 *   - JSON mode loads 5 items (090050-090090) — no API key needed.
 *   - We call renderAnfragePanel() directly via page.evaluate with mock data
 *     to test the rendering function in isolation (no re-render timing issues).
 *   - For visual tests we inject the rendered HTML into the first card's panel
 *     and take screenshots.
 */
const { test, expect } = require('@playwright/test');


// Mock Anfrage item matching a real fixture item (090050 is the first fixture item)
const MOCK_ANFRAGE_ITEM = {
  Positionsnummer: '090050',
  Produkttyp: 'Sicherheitsleuchte',
  Artikelnummer: 'SN 8400-03 ALB FLD 230V',
  'EAN code': null,
  'Mounting:MountingMethod': 'Deckenaufbau',
  'RatingsCertifications:LuminaireType': 'Sicherheitsleuchte',
  'RatingsCertifications:LuminairePictograph': null,
  Monitoring: 'ML',
  Supply: 'Zentralbatterie',
  Batterietechnologie: null,
  Lichtquelle: 'LED',
  'MaterialData:Material': 'Aluminium-Druckguss',
  'HousingDimensions:Diameter': null,
  'HousingDimensions:Height': 59,
  'HousingDimensions:Length': 130,
  'HousingDimension:Width': 130,
  'HousingColorInformation:Color': 'RAL 9016',
  MaxInputVoltageAC: '230 V',
  'RatingsCertifications:IngressProtection': 'IP40',
  'RatingsCertifications:IKclass': null,
  'RatingsCertifications:InsulationClass': 1,
  'RatingCertifications:Certifications': 'DIN VDE V 0108-100-1, IEC 60598-1, IEC 60598-2-22',
  'ElectronicPerformanceData:MaxPower': '3.0 VA',
  'ElectronicPerformanceData:LuminousFluxMains': null,
  'ElectronicPerformanceData:LuminousFluxEmergency': null,
  Farbtemperatur: 4000,
  'ElectronicPerformanceData:Powerfactor': null,
  'RatingsCertifications:RecognitionDistance': null,
  Anschlussquerschnitt: '2,5mm²',
  Konstantstrom: null,
  'ElectronicBackupTimes:MaxBackupTime': null,
  'TemperaturesBS:MaxTemp': 40,
  'TemperaturesBS:MinTemp': -15,
  'TemperaturesDS:MaxTemp': 40,
  'TemperaturesDS:MinTemp': -15,
  Menge: 52,
  Verkaufstext: 'LED-Sicherheitsleuchte mit optimierter Lichtverteilung zur Ausleuchtung von Rettungswegen. Gehäuse aus pulverbeschichtetem Aluminium zur Deckenaufbaumontage. Lichtverteilung: Asymmetric Low Bay. Inkl. 4-Chip LED-Leuchtmittel. Einzelleuchtenüberwachung mit detaillierter Klartext- / Zielortangabe.',
  'Accessory:Candidates': null,
  'ConstraintProfile:Hard': ['Deckenaufbau', '230V', 'Zentralbatterie'],
  'ConstraintProfile:Soft': ['Aluminium'],
  Warnings: ['MaxPower set to VA value'],
  Evidence: ['230 V AC/DC', 'Einzelleuchtenüberwachung'],
  ExtractionConfidence: 0.95
};

async function loadPage(page) {
  // Just load the page so renderAnfragePanel() is in scope — no need to parse JSON
  await page.goto('/docs/index.html');
  // Wait for the JS to initialise (function must be on window)
  await page.waitForFunction(() => typeof window.renderAnfragePanel === 'function');
}


/** Render the panel HTML via evaluate and return it as a string */
async function renderPanel(page, item = MOCK_ANFRAGE_ITEM) {
  return page.evaluate((mockItem) => {
    const anfrageIndex = { [String(mockItem.Positionsnummer)]: mockItem };
    return window.renderAnfragePanel(mockItem.Positionsnummer, [], anfrageIndex);
  }, item);
}

// ─── HTML string tests (no DOM timing issues) ───────────────────────────────

test('renders Originaltext der Anfrage section from Verkaufstext', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  expect(html).toContain('anfrage-source-text');
  expect(html).toContain('Originaltext');
  expect(html).toContain('anfrage-text-details');
  expect(html).toContain('anfrage-text-pre');
  // Preview truncated at 120 chars + ellipsis
  expect(html).toContain('LED-Sicherheitsleuchte');
  expect(html).toContain('\u2026'); // ellipsis
  // Full text in <pre>
  expect(html).toContain('Einzelleuchtenüberwachung');
});

test('ExtractionConfidence 0.95 renders as 95% with class "high"', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  expect(html).toContain('95%');
  expect(html).not.toMatch(/0\.95%/);
  expect(html).toContain('anfrage-confidence high');
});

test('ExtractionConfidence 0.75 renders as 75% with class "mid"', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page, { ...MOCK_ANFRAGE_ITEM, ExtractionConfidence: 0.75 });

  expect(html).toContain('75%');
  expect(html).toContain('anfrage-confidence mid');
  expect(html).not.toContain('anfrage-confidence high');
});

test('ExtractionConfidence 0.5 renders as 50% with class "low"', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page, { ...MOCK_ANFRAGE_ITEM, ExtractionConfidence: 0.5 });

  expect(html).toContain('50%');
  expect(html).toContain('anfrage-confidence low');
});

test('Warnings render as alert badges', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  expect(html).toContain('anfrage-warn-row');
  expect(html).toContain('anfrage-warn-badge');
  expect(html).toContain('MaxPower set to VA value');
  expect(html).toContain('\u26A0'); // ⚠ symbol
});

test('Multiple warnings each get a badge', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page, {
    ...MOCK_ANFRAGE_ITEM,
    Warnings: ['MaxPower set to VA value', 'Missing backup time']
  });

  const badgeCount = (html.match(/anfrage-warn-badge/g) || []).length;
  expect(badgeCount).toBe(2);
  expect(html).toContain('Missing backup time');
});

test('Hard and soft constraint badges render correctly', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  expect(html).toContain('constraint-badge-hard');
  expect(html).toContain('Deckenaufbau');
  expect(html).toContain('230V');
  expect(html).toContain('Zentralbatterie');
  expect(html).toContain('constraint-badge-soft');
  expect(html).toContain('Aluminium');
});

test('Dynamic fields: HousingDimensions Height and Length appear in field table', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  expect(html).toContain('HousingDimensions:Height');
  expect(html).toContain('59');
  expect(html).toContain('HousingDimensions:Length');
  expect(html).toContain('130');
});

test('Dynamic fields: ElectronicPerformanceData:MaxPower appears in field table', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  expect(html).toContain('ElectronicPerformanceData:MaxPower');
  expect(html).toContain('3.0 VA');
});

test('Dynamic fields: temperature fields appear in field table', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  expect(html).toContain('TemperaturesBS:MaxTemp');
  expect(html).toContain('TemperaturesDS:MinTemp');
});

test('Null fields are excluded from field table', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  // These are null in MOCK_ANFRAGE_ITEM — must NOT appear
  expect(html).not.toContain('HousingDimensions:Diameter');
  expect(html).not.toContain('ElectronicPerformanceData:LuminousFluxMains');
  expect(html).not.toContain('Batterietechnologie');
  expect(html).not.toContain('RatingsCertifications:IKclass');
});

test('Meta fields are excluded: Positionsnummer, Artikelnummer, Produkttyp', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  // These are in ANFRAGE_META — must NOT be in the field table
  // (Positionsnummer appears in the panel ID, not as a row — check it's not a table cell)
  const fieldTableMatch = html.match(/<table class="anfrage-field-table">([\s\S]*?)<\/table>/);
  if (fieldTableMatch) {
    const tableContent = fieldTableMatch[1];
    expect(tableContent).not.toContain('Artikelnummer');
    expect(tableContent).not.toContain('Produkttyp');
  }
});

test('Panel narrative order: source text before confidence before constraints in HTML', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  const sourcePos = html.indexOf('anfrage-source-text');
  const confPos = html.indexOf('anfrage-confidence');
  const constraintsPos = html.indexOf('anfrage-constraints');

  expect(sourcePos).toBeGreaterThan(-1);
  expect(confPos).toBeGreaterThan(-1);
  expect(constraintsPos).toBeGreaterThan(-1);

  // Source text must come first, then confidence, then constraints
  expect(sourcePos).toBeLessThan(confPos);
  expect(confPos).toBeLessThan(constraintsPos);
});

test('No Verkaufstext: section is absent from HTML', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page, { ...MOCK_ANFRAGE_ITEM, Verkaufstext: null });

  expect(html).not.toContain('anfrage-source-text');
});

test('No Warnings: warn row is absent from HTML', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page, { ...MOCK_ANFRAGE_ITEM, Warnings: [] });

  expect(html).not.toContain('anfrage-warn-badge');
});

// ─── Visual / screenshot tests ──────────────────────────────────────────────

test('Visual: panel renders correctly with all sections open', async ({ page }) => {
  await loadPage(page);
  const html = await renderPanel(page);

  // Create a minimal item card in the page body (loadPage doesn't render results)
  await page.evaluate((panelHtml) => {
    const card = document.createElement('div');
    card.className = 'item-card open'; // 'open' makes item-card-body visible
    card.style.cssText = 'padding:16px;max-width:600px;margin:20px auto;';
    const body = document.createElement('div');
    body.className = 'item-card-body';
    body.innerHTML = panelHtml;
    card.appendChild(body);
    document.body.appendChild(card);
    // Open the panel and expand Verkaufstext
    const anfBody = card.querySelector('.anfrage-body');
    if (anfBody) anfBody.classList.add('open');
    const details = card.querySelector('details.anfrage-text-details');
    if (details) details.open = true;
  }, html);

  const firstCard = page.locator('.item-card').first();

  // Verify DOM elements are present
  await expect(firstCard.locator('.anfrage-source-text')).toBeVisible();
  await expect(firstCard.locator('.anfrage-confidence.high')).toBeVisible();
  await expect(firstCard.locator('.anfrage-warn-badge')).toBeVisible();
  await expect(firstCard.locator('.constraint-badge-hard').first()).toBeVisible();
  await expect(firstCard.locator('.anfrage-text-pre')).toBeVisible();

  await firstCard.screenshot({ path: 'output/playwright/anfrage-panel-all-sections.png' });
  console.log('Screenshot: output/playwright/anfrage-panel-all-sections.png');
});

test('Visual: confidence badge colours (high / mid / low)', async ({ page }) => {
  await loadPage(page);

  const results = await page.evaluate((mockItem) => {
    const render = (conf) => {
      const item = { ...mockItem, ExtractionConfidence: conf };
      return window.renderAnfragePanel(mockItem.Positionsnummer, [], { [mockItem.Positionsnummer]: item });
    };
    return { high: render(0.95), mid: render(0.75), low: render(0.45) };
  }, MOCK_ANFRAGE_ITEM);

  expect(results.high).toContain('anfrage-confidence high');
  expect(results.high).toContain('95%');
  expect(results.mid).toContain('anfrage-confidence mid');
  expect(results.mid).toContain('75%');
  expect(results.low).toContain('anfrage-confidence low');
  expect(results.low).toContain('45%');

  console.log('Confidence colours verified: high(95%) mid(75%) low(45%)');
});
