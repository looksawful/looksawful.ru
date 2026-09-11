import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const interactionUrl = new URL("../src/features/portfolio-pet/interaction.ts", import.meta.url);
const preferencesUrl = new URL("../src/features/portfolio-pet/preferences.ts", import.meta.url);

async function loadRequired(url, label) {
  assert.equal(existsSync(url), true, `RED: ${label} is not implemented yet`);
  return import(url.href);
}

test("PET-015..020/DR-001: click and drag are distinguishable and dragged pet stays recoverable", async () => {
  const { classifyPetGesture, clampPetPosition } = await loadRequired(interactionUrl, "pet interaction contract");

  assert.equal(classifyPetGesture({ dx: 2, dy: 2, durationMs: 120 }), "activate");
  assert.equal(classifyPetGesture({ dx: 38, dy: 14, durationMs: 160 }), "drag");

  const clamped = clampPetPosition({
    position: { x: 980, y: 760 },
    widgetSize: { width: 280, height: 320 },
    viewport: { width: 1024, height: 768 },
    safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    minimumVisible: { width: 88, height: 88 },
  });

  assert.ok(clamped.x <= 1024 - 88, "enough horizontal pet area must remain grab-able");
  assert.ok(clamped.y <= 768 - 88, "enough vertical pet area must remain grab-able");
  assert.ok(clamped.x >= -(280 - 88), "pet cannot be stranded beyond left edge");
  assert.ok(clamped.y >= -(320 - 88), "pet cannot be stranded beyond top edge");
});

test("DR-006: swipe-to-hide is distinct from normal reposition drag", async () => {
  const { classifyPetGesture } = await loadRequired(interactionUrl, "pet interaction contract");

  assert.equal(
    classifyPetGesture({ dx: -42, dy: 4, durationMs: 420, velocityX: -0.1, viewportEdgeDistance: 180 }),
    "drag",
  );
  assert.equal(
    classifyPetGesture({ dx: -150, dy: 8, durationMs: 210, velocityX: -0.72, viewportEdgeDistance: 22 }),
    "hide",
  );
});

test("PET-023..030/DR-007: temporary hide and explicit persistent disable have different persistence", async () => {
  const { reducePetPreference } = await loadRequired(preferencesUrl, "pet visibility preference contract");

  const initial = { permanentlyDisabled: false, temporaryHiddenUntil: null };
  const temporarilyHidden = reducePetPreference(initial, { type: "HIDE_TEMPORARILY", now: 1000, cooldownMs: 300000 });
  assert.equal(temporarilyHidden.permanentlyDisabled, false);
  assert.equal(temporarilyHidden.temporaryHiddenUntil, 301000);

  const returned = reducePetPreference(temporarilyHidden, { type: "AUTO_RETURN", now: 301001 });
  assert.equal(returned.permanentlyDisabled, false);
  assert.equal(returned.temporaryHiddenUntil, null);

  const disabled = reducePetPreference(initial, { type: "DISABLE_PERMANENTLY" });
  assert.equal(disabled.permanentlyDisabled, true);
  assert.equal(disabled.temporaryHiddenUntil, null);

  const attemptedReturn = reducePetPreference(disabled, { type: "AUTO_RETURN", now: 999999 });
  assert.equal(attemptedReturn.permanentlyDisabled, true, "auto-return must not override explicit opt-out");
});
