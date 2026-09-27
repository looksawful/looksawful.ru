# Mobile media-grid contract — 2026-09-27

## Finding

The generic mobile default should be one column. A two-column mobile composition remains an authored opt-in.

## Primary-source evidence

- `src/styles/media.css` owns the generic `.media-group` responsive contract; `docs/agent-context/frontend.md` states that CSS owns responsive layout and that shared `reel` owns horizontal overflow.
- The value `--group-mobile-columns: 2` already existed in the initial repository import `2c7dbdd` (`tmp`); that commit contains no isolated product decision for this default.
- Commit `1b8f7f6fd44ec965ab3b2e7bc7a0bc8371cf8dd9` (`refactor(css): finish generic media-group ownership (#583)`) moved the same generic base from `src/styles/components.css` to `src/styles/media.css`. Its parent and resulting file both contain the value `2`, showing preservation during an ownership refactor rather than a new responsive decision.
- `src/templates/media-group.ts` maps authored `mobileColumns` to `--group-mobile-columns`; `src/types/media-group.ts` exposes that input.
- Current authored data proves both intended exceptions: `src/data/content/sensetique.ts` contains `mobileColumns: 2`, while Sensetique and Awful Mockups also contain explicit `mobileColumns: 1`.
- Existing rail behavior is a separate contract in `src/styles/patterns.css` and `src/styles/media.css`; changing the ordinary-grid default must not replace or disable `.reel`.

## Verified behavior

A Chromium/Opera CDP probe against the current public DOM with the candidate CSS produced one-column ordinary grids at 320/390 px, two columns at 768/1024 px, and no document-level horizontal overflow. A dispatched touch drag moved a Jestei rail from `scrollLeft = 0` to `135` with `overflow-x: auto`.

## Contract

- ordinary mobile media grid: one column by default;
- explicit authored `mobileColumns`: respected;
- authored reel/strip/compact-reel: horizontal scroll remains independent;
- wide container: `--group-columns` controls desktop composition.
