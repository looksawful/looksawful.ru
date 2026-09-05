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

test("mobile project navigation positioning stays browser-native and safe-area aware", async () => {
  const components = await read("src/styles/components.css");
  const base = blockBetween(components, ".project-nav {", ".project-nav__inner {");

  assert.match(base, /position:\s*sticky;/);
  assert.match(base, /inset-block-start:\s*100dvh;/);
  assert.match(base, /translate:\s*0 -100%;/);
  assert.match(base, /env\(safe-area-inset-bottom,\s*0px\)/);
});

test("project navigation installs no VisualViewport positioning loop", async () => {
  const [source, interactive, topStyles] = await Promise.all([
    read("src/components/project-navigation.ts"),
    read("src/interactive.ts"),
    read("src/styles/project-navigation-top.css"),
  ]);

  for (const value of [source, interactive]) {
    assert.doesNotMatch(value, /initProjectNavigationViewportAnchor/);
  }

  assert.doesNotMatch(
    source,
    /visualViewport|calculateProjectNavigationViewportOffset|ProjectNavigationViewportGeometry|project-nav-viewport-offset/,
  );
  assert.doesNotMatch(topStyles, /data-viewport-anchor|project-nav-viewport-offset/);
});

test("wide project navigation keeps the desktop rail constraint", async () => {
  const components = await read("src/styles/components.css");
  const wideStart = components.indexOf("@container projects (width > 96rem)");
  assert.notEqual(wideStart, -1, "missing wide project navigation container rule");

  const wide = components.slice(wideStart);
  const nav = blockBetween(wide, ".project-nav {", ".project-nav__index {");

  assert.match(nav, /inset-block-start:\s*calc\(100svh/);
  assert.match(nav, /translate:\s*none;/);
  assert.match(nav, /block-size:\s*1px;/);
});
