# AGENTS.md

## Purpose

This repo is a static RP Product Matcher frontend. The main application lives in [`docs/index.html`](docs/index.html) as a single-file app.

## Fast Navigation

- Search for `LLM-NAV:` in [`docs/index.html`](docs/index.html).
- `JS PIPELINE` covers upload, API calls, polling, and JSON paste mode.
- `JS RESULTS` covers comparison normalization, rendering, selections, accessories, and export.

## Working Rules

- Keep the project build-free and GitHub Pages compatible.
- Prefer section-level edits over large rewrites inside `docs/index.html`.
- Preserve German and English i18n together when changing labels.
- Preserve sanitized fixture files and do not add live customer data.

## Verification

- Run a local static server from repo root: `python3 -m http.server 8001`
- Open `/docs/index.html`
- Check JSON paste flow, selection state, and export output
