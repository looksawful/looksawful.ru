# playlist filter split — step 3

This step creates source boundaries for the playlist filter without changing visual output.

## Current strategy

The previous `src/visuals/dom/playlist-filter-embed.js` implementation is moved to:

```text
src/visuals/dom/playlist-filter/legacy-app.js
```

The public import path remains stable:

```text
src/visuals/dom/playlist-filter-embed.js
```

That file now acts as a thin adapter and re-exports `initPlaylistFilterEmbed` from the module directory.

## JS boundaries created

```text
src/visuals/dom/playlist-filter/index.js
src/visuals/dom/playlist-filter/legacy-app.js
src/visuals/dom/playlist-filter/state.js
src/visuals/dom/playlist-filter/data.js
src/visuals/dom/playlist-filter/icons.js
src/visuals/dom/playlist-filter/render.js
src/visuals/dom/playlist-filter/interactions.js
src/visuals/dom/playlist-filter/presentation.js
```

The semantic boundary files are intentionally inert during this step. They establish ownership areas for the next extraction pass while `legacy-app.js` preserves visual parity.

## CSS boundaries created

```text
src/styles/playlist-filter-embed.css
src/styles/playlist-filter/index.css
src/styles/playlist-filter/legacy.css
src/styles/playlist-filter/tokens.css
src/styles/playlist-filter/shell.css
src/styles/playlist-filter/controls.css
src/styles/playlist-filter/modal.css
src/styles/playlist-filter/responsive.css
```

The old CSS content is moved to `legacy.css`. The public CSS entry remains `playlist-filter-embed.css`.

## Visual parity rule

No DOM structure, class names, interaction selectors, token values or internal filter styling should change in this step.

## Next extraction pass

After visual QA, move code from `legacy-app.js` into:

1. `data.js` for constants and grouped lists.
2. `icons.js` for SVG and icon templates.
3. `state.js` for mutable filter state.
4. `render.js` for DOM output.
5. `interactions.js` for clicks, drag, input and modal events.
6. `presentation.js` for sizing, fullscreen and visual state helpers.

After that, delete `legacy-app.js` only when the audit and browser QA confirm parity.
