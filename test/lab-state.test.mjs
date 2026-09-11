import test from "node:test";
import assert from "node:assert/strict";

import {
  LAB_VIEWPORT_PRESETS,
  parseLabState,
  sanitizeLabRoute,
  serializeLabState,
} from "../src/devtools/lab/state.ts";

test("Lab state has deterministic old-Lab-compatible defaults", () => {
  assert.deepEqual(parseLabState(""), {
    route: "/",
    preset: "desktop",
    width: 1440,
    height: 1000,
    background: "checker",
    outline: false,
    grid: false,
    inspect: false,
    targetId: "local",
  });

  assert.deepEqual(LAB_VIEWPORT_PRESETS, {
    desktop: { width: 1440, height: 1000 },
    tablet: { width: 834, height: 1112 },
    mobile: { width: 390, height: 844 },
  });
});

test("preset defaults and explicit dimensions are parsed and clamped", () => {
  assert.deepEqual(
    parseLabState("?preset=mobile"),
    {
      route: "/",
      preset: "mobile",
      width: 390,
      height: 844,
      background: "checker",
      outline: false,
      grid: false,
      inspect: false,
      targetId: "local",
    },
  );

  const clamped = parseLabState("?preset=fit&w=10&h=9000");
  assert.equal(clamped.preset, "fit");
  assert.equal(clamped.width, 240);
  assert.equal(clamped.height, 2400);

  const invalid = parseLabState("?preset=nonsense&w=nope&h=wat&bg=purple");
  assert.equal(invalid.preset, "desktop");
  assert.equal(invalid.width, 1440);
  assert.equal(invalid.height, 1000);
  assert.equal(invalid.background, "checker");
});

test("Lab state parses flags, background, target and safe route", () => {
  const state = parseLabState(
    "?route=%2Fwork%2Fjestei-pool%2F%3Fx%3D1%23demo&preset=tablet&bg=dark&outline=1&grid=1&inspect=1&target=preview-42",
  );

  assert.equal(state.route, "/work/jestei-pool/?x=1#demo");
  assert.equal(state.preset, "tablet");
  assert.equal(state.width, 834);
  assert.equal(state.height, 1112);
  assert.equal(state.background, "dark");
  assert.equal(state.outline, true);
  assert.equal(state.grid, true);
  assert.equal(state.inspect, true);
  assert.equal(state.targetId, "preview-42");
});

test("route sanitizer rejects external and executable schemes", () => {
  assert.equal(sanitizeLabRoute("https://evil.example/x"), "/");
  assert.equal(sanitizeLabRoute("javascript:alert(1)"), "/");
  assert.equal(sanitizeLabRoute("//evil.example/x"), "/");
  assert.equal(sanitizeLabRoute("  work/styx/?view=1#x  "), "/work/styx/?view=1#x");
  assert.equal(sanitizeLabRoute(""), "/");
});

test("serialized Lab state round-trips without changing meaning", () => {
  const source = {
    route: "/work/styx/?mode=lab#media",
    preset: "fit",
    width: 1275,
    height: 903,
    background: "light",
    outline: true,
    grid: false,
    inspect: true,
    targetId: "production",
  };

  const serialized = serializeLabState(source);
  assert.ok(serialized.startsWith("?"));
  assert.deepEqual(parseLabState(serialized), source);
});
