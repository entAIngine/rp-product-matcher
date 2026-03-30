# Hosting Notes

## Current Setup

- Origin hosting target: GitHub Pages
- Publishing model: `main` branch, `/docs` folder
- Initial project URL: `https://entaingine.github.io/rp-product-matcher/`
- Site shape: single-file `index.html` plus checked-in static assets

This repository intentionally stays build-free for now. GitHub Pages should publish the raw contents of `docs/` without a framework build step.

## Why `.nojekyll` Exists

`docs/.nojekyll` is committed so GitHub Pages serves the directory as plain static content without Jekyll processing assumptions.

## Current Security Boundary

- `docs/index.html` includes a meta Content Security Policy and a referrer policy.
- These protections help for local use and GitHub Pages hosting, but they are still document-level controls.
- Real response headers such as HSTS, X-Frame-Options, X-Content-Type-Options, and Permissions-Policy are not managed by this repository on GitHub Pages.

## Later Cloudflare Fronting Model

When a production custom domain is ready, keep GitHub Pages as the origin and place Cloudflare in front of it.

Recommended later settings:

- DNS proxied through Cloudflare
- SSL/TLS mode: `Full (strict)` after GitHub Pages has issued a valid certificate for the custom domain
- `Always Use HTTPS`: enabled
- Response header rules:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` with unused capabilities disabled

## Later Custom Domain Flow

1. Verify the domain in GitHub Pages at the account or organization level.
2. Add the custom domain in repository `Settings -> Pages`.
3. Configure DNS:
   - Apex: `A` records to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Optional IPv6: `AAAA` records to GitHub Pages IPv6 addresses
   - Subdomain such as `www`: `CNAME` to `entaingine.github.io`
4. Wait for GitHub Pages certificate issuance.
5. Enable GitHub Pages HTTPS enforcement.
6. Turn Cloudflare proxying on for the production hostname.
7. Apply the Cloudflare HTTPS and response-header rules.

## Validation Checklist

- Local `file://` open still works for direct customer use
- Hosted GitHub Pages URL loads correctly from `/rp-product-matcher/`
- API mode works
- JSON paste mode works
- CSV and JSON exports still work
- After Cloudflare cutover, `curl -I` on the custom domain shows the expected security headers
