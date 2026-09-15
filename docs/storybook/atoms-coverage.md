# Storybook atom coverage

Integration baseline: `storybook/coverage-ci` at `ee4874e9bd15dffe4e6f5438bfc17e3df5a49e9b`.

## Evidence-backed atom owner set

The audited owner map identifies two high-confidence atom-level production owners. Thin aliases are not counted as extra atoms, and infrastructure/supporting data/experimental LAB code is excluded.

| Owner | Production paths | Story status | Evidence |
| --- | --- | --- | --- |
| Client Logo | `src/templates/client-logo.ts`, thin facade `src/components/composition/client-logo.ts` | covered | `01 Atoms/Client Logo` imports the canonical renderer and real `clientLogos` data. |
| Responsive Image | `src/templates/responsive-image.ts`, thin facade `src/components/composition/responsive-image.ts` | covered in this branch | `01 Atoms/Responsive Image` declares the canonical owner and exercises it through production `renderMediaElement()` with real media catalog/entry data and generated responsive variants. |

## State coverage

Client Logo has one evidence-backed visual state: `default` / always visible. No hover, focus, active, disabled, async or breakpoint-hiding state is manufactured.

Responsive Image has two production loading modes that materially change its responsive `sizes` contract:

- `lazy`: `sizes="auto, 100vw"` through the canonical helper;
- `eager`: `sizes="100vw"` through the same helper.

Both use the real responsive variant registry and are reviewed at the canonical LAB desktop, tablet and mobile viewports. The story does not duplicate production `<img>` markup or manually author `srcset`; the production media renderer remains the markup owner.

## Deliberate exclusions

`src/data/**`, media registries and responsive-policy helpers are supporting data/behavior, not extra visual atoms. `foundations.stories.js` remains foundation coverage rather than atom coverage. Experimental model-viewer controls do not count as canonical production evidence.

The broader inventory may still report unrelated missing/partial UI sources. This atom track does not relabel molecules, organisms, pages or infrastructure merely to improve the coverage number.
