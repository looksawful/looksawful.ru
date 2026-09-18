import assert from "node:assert/strict";
import test from "node:test";

import { classifyToken, resolveTokenValue } from "../src/lab/token-visualization.mjs";

test("classifies canonical token families by value and name", () => {
  assert.equal(classifyToken("--clr-accent", "#ff5a1f"), "color");
  assert.equal(classifyToken("--hero-gradient", "linear-gradient(90deg, #000, #fff)"), "gradient");
  assert.equal(classifyToken("--font-body", '"Inter Variable", sans-serif'), "font-family");
  assert.equal(classifyToken("--font-size-body", "1rem"), "font-size");
  assert.equal(classifyToken("--line-height-body", "1.4"), "line-height");
  assert.equal(classifyToken("--space-4", "1rem"), "spacing");
  assert.equal(classifyToken("--radius-card", "24px"), "radius");
  assert.equal(classifyToken("--media-ratio", "16 / 9"), "aspect-ratio");
  assert.equal(classifyToken("--mobile-mockup-aspect-ratio", "9 / 19.5"), "aspect-ratio");
  assert.equal(classifyToken("--shadow-card", "0 8px 30px rgb(0 0 0 / 20%)"), "shadow");
  assert.equal(classifyToken("--opacity-muted", "0.6"), "opacity");
  assert.equal(classifyToken("--z-overlay", "20"), "z-index");
  assert.equal(classifyToken("--motion-duration-fast", "160ms"), "duration");
  assert.equal(classifyToken("--motion-ease", "cubic-bezier(.2,.8,.2,1)"), "easing");
});

test("resolves simple var aliases without duplicating token values", () => {
  const values = new Map([["--clr-brand", "#ff5a1f"], ["--clr-action", "var(--clr-brand)"]]);
  assert.equal(resolveTokenValue("var(--clr-action)", values), "#ff5a1f");
});

test("keeps unresolved and cyclic aliases safe", () => {
  const values = new Map([["--a", "var(--b)"], ["--b", "var(--a)"]]);
  assert.equal(resolveTokenValue("var(--missing)", values), "var(--missing)");
  assert.equal(resolveTokenValue("var(--a)", values), "var(--a)");
});