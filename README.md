# RP Product Matcher Frontend

Static GitHub Pages deployment for the RP Product Matcher review UI.

## Layout

- `docs/index.html`: deployable frontend page for GitHub Pages.
- `docs/test_multi_item.json`: sample pasted JSON payload for local verification.

## GitHub Pages Setup

1. Push this repository to GitHub.
2. Open `Settings -> Pages`.
3. Set `Source` to `Deploy from a branch`.
4. Choose the default branch and the `/docs` folder.
5. Save. GitHub will publish `docs/index.html`.

## Custom Domain Later

When you are ready to use a custom domain:

1. Add the domain in `Settings -> Pages`.
2. Create the DNS record requested by GitHub.
3. Add a `docs/CNAME` file with the final hostname.
4. Re-check HTTPS enforcement in Pages settings after DNS resolves.

Do not commit a `CNAME` file until the final hostname is confirmed.

## Local Run

Serve the `docs` folder with any static HTTP server.

Example:

```bash
python3 -m http.server 8765 --directory docs
```

Open `http://127.0.0.1:8765`.

## Playwright Playbooks

Use these flows for fixture-driven frontend regression checks.

### Open the app

```bash
python3 -m http.server 8001
```

Then navigate Playwright to:

```text
http://127.0.0.1:8001/docs/index.html
```

Serve the repo root, not only `docs/`, so Playwright can load the checked-in fixtures from `/.playwright-mcp/`.

### Matrix regression flow

1. Open `http://127.0.0.1:8001/docs/index.html`.
2. Click `JSON einfügen`.
3. Load `/.playwright-mcp/wp7-paste-full.json`.
4. Click `JSON verarbeiten`.
5. Inspect the first result card and the comparison matrix.
6. Reload and repeat with `/.playwright-mcp/wp7-table-test.json`.

### Matrix regression checks

- Proposal cells use the full column width and do not collapse into vertical text strips.
- Left sticky columns (`Feld`, `Ihre Anfrage`) stay aligned with the result columns while scrolling.
- Long query values wrap cleanly inside the inquiry column instead of breaking at arbitrary characters.
- The orange review block renders as an expandable disclosure with a visible count and readable itemized reasons.
- `Produktdaten`, `Auswählen`, and `Kein Vorschlag passend` remain clickable after the matrix re-renders.
- No API key or session value is hardcoded in the shipped HTML.

### Manual paste flow

1. Open the page.
2. Click `JSON einfügen`.
3. Paste `docs/test_multi_item.json` into the textarea.
4. Click `JSON verarbeiten`.
5. Inspect the results matrix and export section.

## LLM Setup Instructions

Use this repo as a static-site repo. The intended maintenance model is:

1. Edit only files under `docs/` unless repo-level docs or ignore rules need updates.
2. Treat the frontend as build-free. Do not introduce a framework or bundler unless explicitly requested.
3. Never commit `.env` files, pasted customer payloads, API keys, screenshots with sensitive data, or local Playwright artifacts.
4. Before changing UI behavior, test the `JSON einfügen` flow with `docs/test_multi_item.json`.
5. If adding new fixtures, keep them sanitized and clearly marked as non-production.

## Secret Safety

This repo is configured with a defensive `.gitignore`, but that is only a safety net.

Never commit:

- API keys
- `.env` files
- customer request payloads with live data
- session exports
- browser artifacts containing sensitive screenshots
