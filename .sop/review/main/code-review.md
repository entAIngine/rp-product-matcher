# Code Review: main

## Summary

Review scope is the current working-tree change against `main`. There is no branch divergence from `main`; the review covers the uncommitted frontend and Playwright E2E additions in this working tree.

The earlier high-signal issues in the resume/share flow were addressed:
- resume polling now aborts any existing in-flight poller before starting a new one
- in-progress resume caching no longer stores stale results from another process
- share-link copying now has a failure fallback instead of silently doing nothing

At this point, no correctness bugs were confirmed in the reviewed delta. Remaining risk is concentrated in a few still-untested edge cases around cached processing restoration and repeated resume actions.

## Changes Overview

- Added a third frontend mode, `Resume Process`, with process ID entry and API key reuse.
- Added URL/state synchronization using `?process=<id>` and step hashes.
- Added session storage persistence for API key and per-process cached payloads/results.
- Added process ribbons and share-link copy actions in processing and results views.
- Refactored upload/start/poll flow into `startNewProcess()` and `startResumeFromInput()`.
- Added cached processing/results restoration on reload and browser back/forward support.
- Added Playwright E2E coverage for API mode, JSON mode, and completed-process resume mode.

## Findings

### Critical

None.

### Warning

None.

### Suggestion

None.

## Positive Notes

- The route contract is implemented conservatively: process ID stays in the URL, while the API key remains session-scoped and never enters the share link.
- The processing/results ribbons make the active process visible and reinforce the “resume/share” mental model without disrupting the existing API and JSON flows.
- The inline resume status panel is a better UX than `alert(...)` for shared-link failures and missing-key states.
- The Playwright suite is configured to avoid trace/video/screenshot capture, which reduces the risk of test artifacts containing secrets.

## Test Gaps

- Covered now:
  - API mode starts a live process and persists `?process=<id>#processing`
  - JSON mode renders a tracked fixture into results
  - Resume mode loads completed results for a known process ID

- Still untested:
  - restoring `#processing` from cache after reload
  - starting a second resume while one is already polling
  - proving a resumed process never renders cached results from another process
