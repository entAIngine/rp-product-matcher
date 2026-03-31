# RP Product Matcher

Static review UI for RP Group product-matching results. The app is intentionally build-free and ships as a single HTML file from [`docs/index.html`](docs/index.html).

## What It Does

- Uploads a `.p93` file and starts the remote Entaingine process.
- Supports a JSON paste mode for offline review and regression testing.
- Renders extracted inquiry fields, ranked product proposals, a comparison matrix, and export output.
- Can be hosted directly from GitHub Pages via the `docs/` folder.

## Repo Layout

- [`docs/index.html`](docs/index.html): complete app, including HTML, CSS, JS, i18n strings, and accessory lookup data.
- [`docs/assets/`](docs/assets): logo and favicon assets used by the static page.
- [`docs/HOSTING.md`](docs/HOSTING.md): GitHub Pages and later Cloudflare hosting notes.
- [`docs/test_multi_item.json`](docs/test_multi_item.json): local JSON fixture for manual testing.
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
- Search for `LLM-NAV:` comments in the HTML file to jump to major code regions quickly.
- Preserve static hosting compatibility. Avoid changes that assume a server framework or bundler.

## Manual Checks

1. Open the app locally.
2. Test `JSON einfügen` with [`docs/test_multi_item.json`](docs/test_multi_item.json).
3. Verify proposal selection, accessory selection, and export output.
4. If API mode changed, also verify `.p93` upload flow with a sanitized test file.

## Hosting

Current target: GitHub Pages from `main` + `/docs`.

See [`docs/HOSTING.md`](docs/HOSTING.md) for setup details and later Cloudflare hardening.

## Safety

- Do not commit API keys, customer payloads, screenshots with live data, or `.env` files.
- Treat the browser-entered API key as user-managed secret material even though it is kept in memory only.
