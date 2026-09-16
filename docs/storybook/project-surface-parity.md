# Project surface parity

This document defines how production project UI is represented in the private Lab/Storybook without merging the intentionally divergent `prod` and `lab` histories.

## Sources of truth

- `prod` owns public page composition, component renderers, canonical content contracts and release gating.
- `src/content/contracts/project-component-surfaces.ts` is the machine-readable list of production project UI surfaces that require approval coverage.
- `src/lab/storybook/project-surface-coverage.mjs` maps every registered surface to production-backed Storybook coverage or to an explicit blocking issue.
- `src/content/pages/**` and production data modules provide story fixtures. Lab stories must not fork authored project copy merely to make a demo.
- The media catalog remains the source of truth for media-bearing components. A Storybook story does not authorize a public release.

## Coverage statuses

- `direct`: the canonical renderer is mounted directly in Storybook.
- `indirect`: an implementation helper is exercised through the canonical component that owns its DOM. `responsive-image` currently uses this status.
- `blocked`: a required production contract has no honest visual renderer yet. The entry must include a GitHub issue and reason. A Lab-only imitation is not acceptable.

## Current intentional blocker

`project-teaser` is tracked by issue #967 because `src/components/composition/project-teaser.ts` currently defines a presentation contract but no production renderer. It remains visible in the parity inventory instead of being silently omitted.

## CI rule

A new Storybook-required production surface must be added to the Lab parity manifest. Direct/indirect coverage must point to a real `*.stories.js` or `*.stories.mjs` module. Blocked coverage must point to a tracked issue.

The private Lab verification workflow targets pull requests into `lab` and builds the isolated Lab, Storybook, the general design-system inventory and the project-surface parity inventory. Public production artifacts must remain free of Lab output.

## Branch rule

Do not merge `prod` into `lab` or `lab` into `prod` wholesale. Port verified contracts/renderers selectively, preserving the branch boundary. Production changes use production PR/deploy verification; approval-surface changes use Lab PR/preview verification.
