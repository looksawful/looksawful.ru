import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function blockBetween(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return source.slice(from, to);
}

test("compact project navigation docks without dynamic viewport positioning", async () => {
  const owner = await read("src/styles/project-navigation.css");
  const base = blockBetween(owner, ".project-nav {", ".project-nav__inner {");
  const compactStart = owner.indexOf("@container projects (width <= 96rem)");
  assert.notEqual(compactStart, -1, "missing compact project navigation container rule");
  const compact = owner.slice(compactStart);

  assert.doesNotMatch(base, /inset-block-start:\s*100dvh;/);
  assert.doesNotMatch(base, /translate:\s*0 -100%;/);
  assert.doesNotMatch(compact, /100dvh/);
  assert.match(compact, /\.project-nav\[data-project-nav-enhanced\][\s\S]*?min-block-size\s*:/);
  assert.match(
    compact,
    /\.project-nav\[data-project-nav-enhanced\]\s+\.project-nav__inner[\s\S]*?position:\s*fixed;[\s\S]*?inset-block-end:\s*calc\([\s\S]*?env\(safe-area-inset-bottom,\s*0px\)/,
  );
  assert.match(
    compact,
    /\.project-nav\[data-project-nav-enhanced\]:not\(\[data-project-nav-docked\]\)\s+\.project-nav__inner[\s\S]*?visibility:\s*hidden;[\s\S]*?pointer-events:\s*none;/,
  );
  assert.match(
    compact,
    /\.project-nav\[data-project-nav-docked\]\s+\.project-nav__inner[\s\S]*?visibility:\s*visible;/,
  );
});

test("compact project navigation has no full-width backdrop layer", async () => {
  const owner = await read("src/styles/project-navigation.css");
  const base = blockBetween(owner, ".project-nav {", ".project-nav__inner {");

  assert.match(base, /background:\s*transparent;/);
  assert.doesNotMatch(base, /border-block-start\s*:/);
});

test("dock presence observer installs no viewport geometry loop", async () => {
  const [source, interactive, owner] = await Promise.all([
    read("src/components/project-navigation.ts"),
    read("src/interactive.ts"),
    read("src/styles/project-navigation.css"),
  ]);

  for (const value of [source, interactive]) {
    assert.doesNotMatch(value, /initProjectNavigationViewportAnchor/);
  }

  assert.doesNotMatch(
    source,
    /visualViewport|calculateProjectNavigationViewportOffset|ProjectNavigationViewportGeometry|project-nav-viewport-offset/,
  );

  const dock = blockBetween(
    source,
    "export function initProjectNavigationDock(",
    "export function initProjectNavigationFallback(",
  );
  assert.doesNotMatch(
    dock,
    /visualViewport|requestAnimationFrame|getBoundingClientRect|style\.setProperty|addEventListener\(["'](?:scroll|resize)/,
  );
  assert.doesNotMatch(owner, /data-viewport-anchor|project-nav-viewport-offset/);
});

test("wide project navigation keeps the desktop rail constraint", async () => {
  const owner = await read("src/styles/project-navigation.css");
  const wideStart = owner.indexOf("@container projects (width > 96rem)");
  assert.notEqual(wideStart, -1, "missing wide project navigation container rule");

  const wide = owner.slice(wideStart);
  const nav = blockBetween(wide, ".project-nav {", ".project-nav__index {");

  assert.match(nav, /position:\s*sticky;/);
  assert.match(nav, /inset-block-start:\s*calc\(100svh/);
  assert.match(nav, /translate:\s*none;/);
  assert.match(nav, /block-size:\s*1px;/);
});
