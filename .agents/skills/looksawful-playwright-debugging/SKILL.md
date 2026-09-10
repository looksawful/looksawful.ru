---
name: looksawful-playwright-debugging
description: Use when a Playwright/browser check in looksawful.ru fails, flakes, produces a visual delta, or needs trace/snapshot/console/network diagnosis before changing code or tests.
---

# Looksawful Playwright debugging

Use this after `diagnosing-bugs` for browser-specific failures. Prefer evidence from the exact failing SHA and the repository's existing Playwright/affected-test infrastructure over a fresh broad test campaign.

## Triage order

1. Identify the exact SHA, workflow/suite, test, viewport, route, and failing assertion.
2. Reproduce with the cheapest existing focused command if practical.
3. If a Playwright trace exists, inspect it before editing code: failed actions first, then action details, errors, console, failed requests, and the relevant DOM snapshot/screenshot.
4. Map the failure back to the owning runtime/CSS/component contract.
5. Make the smallest source fix, then rerun the same focused proof.
6. Escalate to affected/full browser coverage only when the changed seam requires it.

## Trace-first diagnosis

When the installed Playwright version exposes trace CLI inspection, use the equivalent of:

- list actions and failed actions;
- inspect the failing action and source location;
- inspect `errors`, browser console, and failed network requests;
- inspect before/action/after DOM snapshots when state changed unexpectedly;
- use a screenshot from the frozen snapshot only when visual evidence helps classify the failure.

Do not infer a CSS/runtime root cause from a final screenshot alone when the trace contains better state evidence.

## Visual regression policy

Keep visual snapshots for stable, deterministic component states: fixed viewport, fixed content, controlled interaction state, and motion disabled/frozen where appropriate.

Do not make video frames, live Canvas/WebGL, Three.js, actively moving GSAP/reels, asynchronous media timing, or other inherently nondeterministic surfaces permanent pixel baselines unless the test explicitly freezes the source of variation.

Classify a visual delta before fixing it:

- real layout/style regression;
- motion phase/timing difference;
- media loading/render nondeterminism;
- runtime state difference;
- expected authored change.

Computed geometry/state assertions are often cheaper and more stable than pixels for dynamic surfaces.

## Flake discipline

- Never fix a flaky test by adding arbitrary sleeps or retries first.
- Prefer web-first assertions, stable semantic locators, explicit state seams, and deterministic fixtures.
- A temporary diagnostic test/probe remains TEMPORARY by default under `docs/testing-policy.md`; delete it after diagnosis unless it protects a durable contract at the cheapest appropriate tier.
- Do not rewrite product code only to satisfy an unrealistic test harness if the browser behavior is correct; improve the harness/fixture instead.

## Completion

Report the classified root cause, the focused command/test that proves the fix, and whether any broader affected gate was required. If a trace or browser check could not be run in the current environment, state that explicitly.

## Upstream reference

Adapted from Microsoft Playwright's official `playwright-trace` skill and CLI diagnostic workflow, reviewed at commit `4302dbb90f65e80da3f4f08a2e028c9e642b64b9`. Repository-local test tiers and lifecycle rules override generic Playwright examples.
