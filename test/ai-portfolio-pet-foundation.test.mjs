import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const featureRoot = new URL("../src/features/portfolio-pet/", import.meta.url);
const requiredFiles = [
  "feature-flag.ts",
  "intent-router.ts",
  "sprite-manifest.ts",
  "state.ts",
];

test("AI portfolio pet foundation exposes cheap deterministic contracts", async () => {
  for (const file of requiredFiles) {
    assert.equal(
      existsSync(new URL(file, featureRoot)),
      true,
      `missing AI portfolio pet foundation file: ${file}`,
    );
  }

  const [featureFlag, intentRouter, spriteManifest, state] = await Promise.all([
    import(new URL("feature-flag.ts", featureRoot)),
    import(new URL("intent-router.ts", featureRoot)),
    import(new URL("sprite-manifest.ts", featureRoot)),
    import(new URL("state.ts", featureRoot)),
  ]);

  assert.equal(featureFlag.resolvePortfolioPetEnabled({ isDev: true }), true);
  assert.equal(featureFlag.resolvePortfolioPetEnabled({ isDev: false, envValue: "1" }), true);
  assert.equal(featureFlag.resolvePortfolioPetEnabled({ isDev: false, envValue: "0" }), false);
  assert.equal(featureFlag.resolvePortfolioPetEnabled({ isDev: false }), false);

  assert.deepEqual(
    intentRouter.routePortfolioPetIntent({ message: "покажи кейсы", locale: "ru" }),
    { kind: "local", action: "cases" },
  );
  assert.deepEqual(
    intentRouter.routePortfolioPetIntent({ message: "resume", locale: "en" }),
    { kind: "local", action: "resume" },
  );
  assert.deepEqual(
    intentRouter.routePortfolioPetIntent({ message: "составь письмо", locale: "ru" }),
    { kind: "local", action: "writer-email" },
  );
  assert.deepEqual(
    intentRouter.routePortfolioPetIntent({ message: "сыграем", locale: "ru" }),
    { kind: "local", action: "game" },
  );
  assert.deepEqual(
    intentRouter.routePortfolioPetIntent({
      message: "Что ты думаешь о его подходе к дизайн-системам?",
      locale: "ru",
    }),
    { kind: "model", action: "free-chat" },
  );

  const validManifest = {
    version: 1,
    characterId: "fixture",
    animations: {
      idle: {
        src: "/fixture.png",
        frameWidth: 64,
        frameHeight: 96,
        frameCount: 4,
        fps: 8,
        loop: true,
        anchor: { x: 0.5, y: 1 },
      },
    },
  };

  assert.deepEqual(spriteManifest.parseSpriteManifest(validManifest), validManifest);
  assert.throws(
    () => spriteManifest.parseSpriteManifest({
      ...validManifest,
      animations: {
        idle: { ...validManifest.animations.idle, frameWidth: 0 },
      },
    }),
    /frameWidth/,
  );

  const initial = state.createPortfolioPetState();
  assert.deepEqual(initial, { view: "closed", pet: "idle" });
  assert.deepEqual(state.reducePortfolioPetState(initial, { type: "OPEN" }), {
    view: "home",
    pet: "open",
  });
  assert.deepEqual(
    state.reducePortfolioPetState({ view: "free-chat", pet: "open" }, { type: "AI_START" }),
    { view: "loading", pet: "think" },
  );
  assert.deepEqual(
    state.reducePortfolioPetState({ view: "loading", pet: "think" }, { type: "AI_SUCCESS" }),
    { view: "free-chat", pet: "speak" },
  );
  assert.deepEqual(
    state.reducePortfolioPetState({ view: "home", pet: "open" }, { type: "CLOSE" }),
    { view: "closed", pet: "idle" },
  );
});
