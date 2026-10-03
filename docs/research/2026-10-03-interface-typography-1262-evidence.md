# Interface typography evidence for #1262 — 2026-10-03

Status: research / review evidence  
Parent: #1244  
Implementation issue: #1262  
Baseline: stacked UI branch `feat/ui-selection-1261`

## Question

What can be safely reconciled in the current Inter-era interface typography without inventing a new typography system, and what requires a visual human decision?

## Repository findings

### 1. Current global contract is Inter-era

`src/styles/tokens.css` defines:

- `--ff-primary: "Inter Variable", ...`
- weight tokens `--fw-300` through `--fw-900`
- font-size scale `--fs-200` through `--fs-900`
- semantic line-height aliases such as `--lh-caption`, `--lh-ui`, `--lh-tight`, `--lh-heading`, `--lh-display`, `--lh-hero`

The current scale does **not** define `--fs-100`.

### 2. `--fs-100` is a real production contract defect

`src/site/renderers/home/home-slots.ts` uses:

```css
.subproject-card__badge {
  font-size: var(--fs-100);
}
```

No current repository definition for `--fs-100` was found.

An older Inter-era repository snapshot at commit `5eb44270` already contains the same badge usage while its `tokens.css` also begins at `--fs-200`. Therefore the available history does not provide a known deleted `--fs-100` value that can simply be restored.

### 3. Actual CSS behavior

MDN's current `var()` documentation states that when a referenced custom property is undefined and no fallback is supplied, the `var()` resolves invalid and the property is treated as `unset`.

For `font-size`, which is inherited, the practical result is inheritance from the parent.

Primary source:
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/var

Implication: the current badge size is not a stable tokenized size; it is an accidental inherited result.

### 4. Current role inventory

Observed current interface typography separates into these practical families:

- compact action text;
- compact labels;
- supporting navigation / captions;
- metadata / credits;
- sequence counters;
- display/editorial typography.

The same numeric size is not sufficient evidence that two roles should share one semantic typography token.

### 5. Repeated supporting text size is evidence, not yet a universal role

The repository repeats:

```css
clamp(0.72rem, 0.68rem + 0.15cqi, 0.84rem)
```

across multiple supporting-copy/navigation/caption surfaces.

This is a de-facto repeated value worth reconciling, but extracting it under one semantic name would be wrong unless the consumers actually share a role. A low-level size token/alias may be justified; a broad `caption` semantic role should not swallow navigation or other supporting copy merely because the values match.

### 6. DTCG does not require a monolithic typography abstraction

The Design Tokens Community Group Format 2025.10 defines typography as a composite whose components may reference independent token types:

- `fontSize` is a dimension or reference to a dimension token;
- `lineHeight` is a number or reference to a number token;
- individual typography components can reference shared base components while defining other components locally.

Primary source:
- https://www.designtokens.org/tr/2025.10/format

Implication for this repository: it is valid to keep stable low-level size/line-height aliases separate and compose them only where a durable semantic typography role is proven. There is no standards reason to create a universal typography composite for every interface string.

### 7. SOFA evidence

A related SOFA answer about scoped CSS custom properties recommends providing defaults for semantic slots so partially themed components do not produce invalid declarations at computed-value time.

This is useful corroboration of the failure mode, but its main context is Tailwind v4 theming, so it is **not** treated as the primary authority for this task.

SOFA post:
- `524a4d98-6b3a-497e-bf29-242d5dddafc2`

## Review correction to the current #1262 note

The existing #1262 inventory says the undefined badge declaration “inherits its size”. This is correct as the observed end result, but the exact mechanism is:

`undefined var() without fallback → invalid at computed-value time → font-size treated as unset → inherited value`.

That wording should be preferred in durable documentation.

## Implementation boundary

### Safe without a visual redesign

1. Preserve the current Inter scale as the base.
2. Reconcile exact repeated low-level typography values only where current production evidence supports reuse.
3. Preserve role-local weight, casing, tracking, line-height, and control geometry when their roles differ.
4. Preserve sequence-counter typography already established by #1260.
5. Do not reintroduce the old Rubik-era global system.

### Requires visual human gate

The `.subproject-card__badge` size.

There is no authoritative historical value for `--fs-100` in the available evidence. Adding a new `--fs-100`, replacing it with `--fs-200`, or choosing a local fixed/fluid value are visibly different design decisions.

The correct next step is a small browser comparison of candidate badge sizes against the real Home pet-project cards, followed by human approval.

### Out of scope

- display/hero/editorial typography normalization;
- a new full typography framework;
- assigning one semantic token merely because several selectors share the same current numeric value;
- silently choosing a missing `--fs-100` value.

## Dependency review discovered while preparing #1262

#1262 depends on #1247, #1260 and #1261. Current review found two unresolved upstream blockers:

### PR #1265 / issue #1247

`tools/lib/static-site-analytics.mjs` still has a separate production consent renderer that:

- does not compose `.action-control`;
- does not set explicit `data-emphasis`;
- still styles the primary action through `:first-child`.

`src/site/build/public-static-build-plugin.ts` loads that renderer when finalizing the production CV page.

Therefore #1247 is not yet fully reconciled across production owners.

### PR #1267 / issue #1261

`src/components/specialized/moves-canvas-demo.ts` renamed the Storybook/data hook from `data-moves-awful-tabs` to `data-moves-awful-options`, but `test/lab-storybook-pet-specialized.test.mjs` still asserts the old hook.

Therefore the broader unit contract is stale and should be updated or explicitly reclassified before #1261 is treated as complete.

PR #1266 did not surface an equivalent blocking finding in this review.

## Recommendation

Do **not** start typography implementation on top of the current stack yet.

First close the two upstream blockers in #1265 and #1267. Then retarget/re-run their normal integration checks. After that, proceed with #1262 in two slices:

1. no-visual-change typography reconciliation;
2. one human-gated Home badge size decision.
