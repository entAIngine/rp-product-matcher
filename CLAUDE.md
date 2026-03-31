# CLAUDE.md

Single-file static frontend repo.

- Primary entrypoint: [`docs/index.html`](docs/index.html)
- Hosting model: GitHub Pages from `docs/`
- Main test path: serve repo root, open `/docs/index.html`, use [`docs/test_multi_item.json`](docs/test_multi_item.json)

When editing:

- Search for `LLM-NAV:` comments first.
- Keep HTML, CSS, JS, and i18n changes consistent inside the same file.
- Do not introduce a build step or framework unless explicitly asked.
- Do not commit secrets, live payloads, or sensitive screenshots.
