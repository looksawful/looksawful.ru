# Interface typography evidence for #1262 — 2026-10-03

Status: implementation evidence  
Parent: #1244  
Implementation issue: #1262  
Baseline: stacked UI branch `feat/ui-selection-1261`

## Current production contract

The current global UI typography is Inter-era. `src/styles/tokens.css` owns the Inter family, weights, the `--fs-200`…`--fs-900` scale, semantic line-height aliases, and editorial tracking aliases.

Older Rubik-era material is historical evidence only. It is not the current specification.

## Current role map

The smallest coherent interface typography roles observed in production are:

- **supporting interface copy** — captions, project-card supporting copy, project-navigation support, and authored Jestei hover copy;
- **compact action text** — stays with each control family because geometry differs;
- **compact labels** — stays local where weight, casing, tracking, or control geometry differs;
- **metadata / credits** — intentionally quieter and smaller than supporting copy;
- **sequence counters** — existing `--fs-200` + heading line-height + tabular numerals;
- **display / editorial typography** — intentionally art-directed and outside normalization.

Matching numeric values alone are not treated as proof of one semantic role.

## Implemented no-visual-change reconciliation

The exact repeated production value

```css
clamp(0.72rem, 0.68rem + 0.15cqi, 0.84rem)
```

is now owned as `--fs-supporting` for six surfaces that also share the supporting-copy role and `--lh-caption`:

- `.media__caption`;
- `.project-nav__link`;
- `.project-nav__top`;
- `.project-card__caption`;
- `.brand-system__hover-copy`;
- `.jestei-captioned-group .jestei-media__hover-copy`.

`.placeholder-surface` deliberately keeps the same numeric value locally because it is a utility placeholder label, not supporting content.

Fixed `0.75rem` usages also remain local. They currently belong to different roles: before/after overlay labels, code index/copy/description text, and media-deck actions.

## Missing `--fs-100` contract

`src/site/renderers/home/home-slots.ts` currently contains:

```css
.subproject-card__badge {
  font-size: var(--fs-100);
}
```

No `--fs-100` token exists in the current scale. Repository history does not reveal a deleted authoritative value: an older Inter-era snapshot already contained the same reference while its scale also began at `--fs-200`.

For an undefined custom property without fallback, `var()` becomes invalid at computed-value time. Because `font-size` is inherited, the practical result is inherited size rather than a stable tokenized badge size.

Primary source: MDN `var()`.

## Human gate

The Home pet-project badge size remains a visible design decision.

Adding `--fs-100`, replacing the reference with `--fs-200`, or choosing a smaller local/fluid value changes hierarchy. No historical evidence proves which value was intended.

This part should be compared in the real browser on the Home pet-project cards and approved visually before implementation.

## Explicit non-goals

- no hero/display/editorial homogenization;
- no Rubik-era typography restoration;
- no universal typography composite;
- no alias created merely because unrelated selectors share one number;
- no silent invention of `--fs-100`.

## Standards rationale

The Design Tokens Community Group format permits typography components such as `fontSize` and `lineHeight` to reference independent underlying tokens. There is no standards requirement to collapse every interface string into a single typography composite.

Primary source: Design Tokens Community Group Format 2025.10.
