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

These flows assume the page is being served locally from `docs/`.

### Open the app

```bash
python3 -m http.server 8765 --directory docs
```

Then navigate Playwright to:

```text
http://127.0.0.1:8765/index.html
```

### Paste JSON flow

1. Open the page.
2. Click `JSON einfügen`.
3. Paste `docs/test_multi_item.json` into the large textarea.
4. Click `JSON verarbeiten`.
5. Inspect the results matrix and export section.

### Regression checks

- Verify the matrix header stays readable with 5 proposals.
- Verify left columns (`Feld`, `Ihre Anfrage`) remain aligned while scrolling.
- Verify comparison cell values stay horizontal and do not stack vertically.
- Verify `Select` / `Auswählen`, `Select none`, CSV export, and JSON export still work.
- Verify no API key or session value is hardcoded in the shipped HTML.

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
