# Jestei Brand Bento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing Jestei logo and type sections into one second bento composition while preserving copy, media proportions, inspector rendering, responsive switching, and slider behavior.

**Architecture:** Extend `reorganizeJesteiLogoMedia()` so it moves the existing type title, paragraph, and remaining Druk image into the live logo composition instead of duplicating markup. Add one late-loaded stylesheet that supplies the shared bento radius, clipping, type-row layout, and responsive overrides while leaving the inspector renderer untouched.

**Tech Stack:** Vanilla JavaScript DOM APIs, CSS Grid/Flexbox, native horizontal scrolling, existing Three.js inspector runtime.

## Global Constraints

- Do not change any user-facing text.
- Do not modify `logo-inspector-grid-3d.js`.
- Preserve the current desktop row / tablet-mobile `2 × 2` inspector logic.
- Preserve all media links, lightbox attributes, aspect ratios, and slider behavior.
- Apply radius only to top-level visual cards; nested `canvas`, `svg`, `img`, and internal wrappers stay square.
- Write directly to branch `prod`, re-fetching every file immediately before each write.

---

### Task 1: Merge the type content into the live logo composition

**Files:**
- Modify: `src/runtime/reorganize-jestei-logo-media.js`

**Interfaces:**
- Consumes: existing `#jestei-logo`, `#jestei-type`, `typeGallery`, title, lead, inspector, and media anchors.
- Produces: `.jestei-logo__type-group`, `.jestei-logo__type-copy`, `.jestei-logo__type-title`, `.jestei-logo__type-media`, and one preserved `#jestei-type` navigation target inside the merged composition.

- [ ] **Step 1: Add a helper that identifies the direct descriptive paragraph in the type block**

```js
function findDirectParagraph(element) {
  return [...element.children].find((child) => child.matches("p")) || null;
}
```

- [ ] **Step 2: Build the type group from the existing nodes**

```js
const typeBlock = typeSection.querySelector("[data-section-block]");
const typeTitle = typeBlock?.querySelector("[data-section-title]");
const typeParagraph = typeBlock ? findDirectParagraph(typeBlock) : null;

const typeGroup = documentRef.createElement("section");
typeGroup.id = "jestei-type";
typeGroup.className = "jestei-logo__type-group";

const typeCopy = documentRef.createElement("div");
typeCopy.className = "jestei-logo__type-copy";
typeTitle.classList.add("jestei-logo__type-title");
typeGallery.classList.add("jestei-logo__type-media");
typeCopy.append(typeTitle, typeParagraph);
typeGroup.append(typeCopy, typeGallery);
```

- [ ] **Step 3: Append the type group after the logo slider and remove the old section**

```js
composition.append(top, inspector, slider, typeGroup);
currentHead.replaceWith(composition);
typeSection.remove();
```

- [ ] **Step 4: Keep the runtime idempotent**

Verify that the existing `data-jestei-logo-composition` guard runs before querying or moving already-relocated nodes.

- [ ] **Step 5: Verify the resulting source**

Run connector reads for the modified file and confirm:

- only existing nodes are moved;
- `#jestei-type` occurs once;
- the four SVG rows and three logo slides remain unchanged;
- no copy literals were edited.

- [ ] **Step 6: Commit**

```bash
git add src/runtime/reorganize-jestei-logo-media.js
git commit -m "Merge Jestei type into brand bento"
```

### Task 2: Add the second bento radius and layout layer

**Files:**
- Create: `src/styles/sections/jestei-brand-bento.css`

**Interfaces:**
- Consumes: classes produced by Task 1 and existing `.jestei-logo__*` classes.
- Produces: shared `--jestei-brand-radius` and responsive visual-card clipping without changing renderer geometry.

- [ ] **Step 1: Define shared bento tokens**

```css
#jestei-logo {
  --jestei-brand-gap: clamp(0.45rem, 1.4cqi, 1.4rem);
  --jestei-brand-radius: clamp(0.8rem, 1.8cqi, 2rem);
}
```

- [ ] **Step 2: Round only top-level visual cards**

```css
#jestei-logo :is(
  .jestei-logo__variant,
  [data-logo-inspector-shell],
  .jestei-logo__slide,
  .jestei-logo__type-media
) {
  overflow: hidden;
  border-radius: var(--jestei-brand-radius);
}
```

- [ ] **Step 3: Remove nested radii and the inspector's internal border**

```css
#jestei-logo :is(
  .jestei-logo__variant-svg,
  [data-logo-inspector-shell] canvas,
  [data-logo-inspector-shell] .logo-inspector-grid-3d,
  [data-logo-inspector-shell] .logo-inspector-grid-3d__canvas,
  [data-logo-inspector-shell] .logo-inspector-grid-3d__poster,
  .jestei-logo__slide img,
  .jestei-logo__type-media a,
  .jestei-logo__type-media img
) {
  border-radius: 0;
}

#jestei-logo [data-logo-inspector-shell] {
  border: 1px solid #050505;
}

#jestei-logo [data-logo-inspector-shell] .logo-inspector-grid-3d {
  border: 0;
}
```

- [ ] **Step 4: Integrate the type content as the final bento row**

```css
.jestei-logo__type-group {
  display: grid;
  grid-template-columns: minmax(15rem, 0.72fr) minmax(0, 1.28fr);
  gap: var(--jestei-brand-gap);
  align-items: stretch;
}

.jestei-logo__type-copy {
  display: grid;
  align-content: start;
  gap: clamp(1rem, 2vw, 2rem);
}

.jestei-logo__type-media {
  aspect-ratio: 16 / 10;
  border: 1px solid #050505;
}
```

- [ ] **Step 5: Preserve tablet and mobile behavior**

Use the first bento radius values at the same ranges and stack the type group below `70rem` without creating a new horizontal scroller.

- [ ] **Step 6: Verify selectors**

Confirm that the stylesheet does not target `.logo-inspector-grid-3d` outside `#jestei-logo` and does not change `aspect-ratio`, camera, transform, or scale values.

- [ ] **Step 7: Commit**

```bash
git add src/styles/sections/jestei-brand-bento.css
git commit -m "Style Jestei brand bento"
```

### Task 3: Load the bento layer last and verify integration

**Files:**
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: `src/styles/sections/jestei-brand-bento.css`.
- Produces: late CSS precedence over the old zero-radius inspector frame and existing logo layout styles.

- [ ] **Step 1: Add the final import**

```css
@import "./sections/jestei-brand-bento.css";
```

Place it after `jestei-logo-wide-slider.css`.

- [ ] **Step 2: Verify import order**

Read `src/styles/index.css` and confirm the new file is the final import.

- [ ] **Step 3: Verify current branch files**

Read the runtime, new stylesheet, and index file from `prod`. Confirm unique IDs, exact radius values, zero nested radii, and unchanged inspector module.

- [ ] **Step 4: Check repository status for the resulting commit**

Use the GitHub combined status endpoint. Report absence of CI checks honestly if none are configured.

- [ ] **Step 5: Commit**

```bash
git add src/styles/index.css
git commit -m "Load Jestei brand bento styles"
```
