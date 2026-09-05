import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectNavigation = await import("../src/components/project-navigation.ts");
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const calculate = projectNavigation.calculateProjectNavigationViewportOffset;

test("mobile project navigation exposes viewport-relative offset calculation", () => {
  assert.equal(typeof calculate, "function");
});

test("mobile project navigation follows visual viewport height changes without sticky or fixed anchoring", { skip: typeof calculate !== "function" }, () => {
  const base = {
    viewportTop: 0,
    naturalNavigationTop: 300,
    navigationHeight: 56,
    sectionTop: 300,
    sectionBottom: 2000,
  };

  assert.equal(calculate({ ...base, viewportHeight: 700 }), 344);
  assert.equal(calculate({ ...base, viewportHeight: 800 }), 444);

  assert.equal(
    calculate({
      viewportTop: 0,
      viewportHeight: 700,
      naturalNavigationTop: 750,
      navigationHeight: 56,
      sectionTop: 750,
      sectionBottom: 2000,
    }),
    0,
  );

  assert.equal(
    calculate({
      viewportTop: 0,
      viewportHeight: 800,
      naturalNavigationTop: -500,
      navigationHeight: 56,
      sectionTop: -500,
      sectionBottom: 720,
    }),
    1164,
  );
});

test("mobile project navigation runtime is wired to visualViewport and avoids viewport-unit sticky positioning", async () => {
  const [styles, interactive, source] = await Promise.all([
    read("src/styles/project-navigation-top.css"),
    read("src/interactive.ts"),
    read("src/components/project-navigation.ts"),
  ]);

  assert.match(source, /visualViewport/);
  assert.match(source, /offsetTop/);
  assert.match(source, /\.height/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(interactive, /initProjectNavigationViewportAnchor/);

  assert.match(
    styles,
    /\.project-nav\[data-viewport-anchor\][\s\S]*?position:\s*relative[\s\S]*?inset-block-start:\s*var\(--project-nav-viewport-offset/,
  );
});
