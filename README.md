# RP Product Matcher

Static review UI for RP Group product-matching results. The app is intentionally build-free and ships as a single HTML file from [`docs/index.html`](docs/index.html).

## What It Does

- Uploads a `.p93` file and starts the remote Entaingine process.
- Supports a JSON paste mode for offline review and regression testing.
- Renders extracted inquiry fields, ranked product proposals, a comparison matrix, and export output.
- Supports adding manual products from the embedded catalog (per item position) with full field comparison and Zubehör/accessory lookup.
- Can be hosted directly from GitHub Pages via the `docs/` folder.

## Repo Layout

- [`docs/index.html`](docs/index.html): complete app — HTML, CSS, JS, i18n strings, accessory lookup data. Loads [`docs/catalog.js`](docs/catalog.js) for product data.
- [`docs/catalog.js`](docs/catalog.js): auto-generated dictionary-encoded product catalog. Exposes `_CATALOG_FIELDS`, `_CATALOG_DICT`, `_CATALOG_DATA` as globals. Do not edit by hand.
- [`docs/product-catalog.csv`](docs/product-catalog.csv): source product catalog used to regenerate `docs/catalog.js`.
- [`docs/assets/`](docs/assets): logo and favicon assets used by the static page.
- [`docs/HOSTING.md`](docs/HOSTING.md): GitHub Pages and later Cloudflare hosting notes.
- [`docs/test_multi_item.json`](docs/test_multi_item.json): local JSON fixture for manual testing.
- [`scripts/generate-catalog.js`](scripts/generate-catalog.js): regenerates [`docs/catalog.js`](docs/catalog.js) from the CSV.
- [`tests/e2e/`](tests/e2e): Playwright end-to-end tests.
- [`.playwright-mcp/`](.playwright-mcp): local regression fixtures used during browser checks.

## Local Run

Serve the repository root so the page can access both `docs/` and fixture files:

```bash
python3 -m http.server 8001
```

Open `http://127.0.0.1:8001/docs/index.html`.

## Editing Notes

- Keep the app build-free unless a migration is explicitly requested.
- Default to editing [`docs/index.html`](docs/index.html); most behavior lives there.
- Do not edit [`docs/catalog.js`](docs/catalog.js) by hand — it's auto-generated from `docs/product-catalog.csv`.
- Search for `LLM-NAV:` comments in the HTML file to jump to major code regions quickly.
- Preserve static hosting compatibility. Avoid changes that assume a server framework or bundler.

## Manual Checks

1. Open the app locally.
2. Test `JSON einfügen` with [`docs/test_multi_item.json`](docs/test_multi_item.json).
3. Verify proposal selection, accessory selection, and export output.
4. Click the `+ Manuelles Produkt` button above a matrix, search for a catalog article, and verify its field values, Zubehör panel, and export summary.
5. If API mode changed, also verify `.p93` upload flow with a sanitized test file.

## Catalog Regeneration

When [`docs/product-catalog.csv`](docs/product-catalog.csv) changes, regenerate the catalog file:

```bash
node scripts/generate-catalog.js
```

The script reads the CSV, extracts 16 comparison fields per published row, builds a dictionary of unique values, and writes [`docs/catalog.js`](docs/catalog.js). [`docs/index.html`](docs/index.html) loads that file via `<script src="catalog.js">`, so no edits to `index.html` are needed when the catalog changes.

## Hosting

Current target: GitHub Pages from `main` + `/docs`.

See [`docs/HOSTING.md`](docs/HOSTING.md) for setup details and later Cloudflare hardening.

## Safety

- Do not commit API keys, customer payloads, screenshots with live data, or `.env` files.
- Treat the browser-entered API key as user-managed secret material even though it is kept in memory only.
