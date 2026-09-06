import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createBeforeAfterOneShotReveal } from "../src/components/before-after.ts";

function createFrames() {
  let nextId = 1;
  const callbacks = new Map();

  return {
    request(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancel(id) {
      callbacks.delete(id);
    },
    run(timestamp) {
      const queued = [...callbacks.values()];
      callbacks.clear();
      queued.forEach((callback) => callback(timestamp));
    },
    pending() {
      return callbacks.size;
    },
  };
}

test("before-after entrance reveal plays min to max only once", () => {
  const frames = createFrames();
  const values = [];
  const reveal = createBeforeAfterOneShotReveal({
    min: 0,
    max: 100,
    durationMs: 1000,
    allowsMotion: () => true,
    setValue: (value) => values.push(value),
    requestFrame: (callback) => frames.request(callback),
    cancelFrame: (id) => frames.cancel(id),
  });

  reveal.enterViewport();
  assert.equal(reveal.hasPlayed(), true);
  assert.equal(values.at(-1), 0);
  assert.equal(frames.pending(), 1);

  frames.run(0);
  frames.run(500);
  assert.equal(values.at(-1), 50);
  frames.run(1000);
  assert.equal(values.at(-1), 100);
  assert.equal(frames.pending(), 0);

  const countAfterFirstPlay = values.length;
  reveal.enterViewport();
  assert.equal(values.length, countAfterFirstPlay);
  assert.equal(frames.pending(), 0);
});

test("before-after entrance reveal is skipped for reduced motion", () => {
  const frames = createFrames();
  const values = [];
  const reveal = createBeforeAfterOneShotReveal({
    min: 0,
    max: 100,
    durationMs: 1000,
    allowsMotion: () => false,
    setValue: (value) => values.push(value),
    requestFrame: (callback) => frames.request(callback),
    cancelFrame: (id) => frames.cancel(id),
  });

  reveal.enterViewport();

  assert.equal(reveal.hasPlayed(), true);
  assert.deepEqual(values, []);
  assert.equal(frames.pending(), 0);
});

test("manual interaction cancels an active entrance reveal without restarting it", () => {
  const frames = createFrames();
  const values = [];
  const reveal = createBeforeAfterOneShotReveal({
    min: 0,
    max: 100,
    durationMs: 1000,
    allowsMotion: () => true,
    setValue: (value) => values.push(value),
    requestFrame: (callback) => frames.request(callback),
    cancelFrame: (id) => frames.cancel(id),
  });

  reveal.enterViewport();
  frames.run(0);
  reveal.cancel();
  const countAtCancel = values.length;

  assert.equal(frames.pending(), 0);
  frames.run(500);
  assert.equal(values.length, countAtCancel);

  reveal.enterViewport();
  assert.equal(values.length, countAtCancel);
});

test("Jestei subscription is the only before-after surface opted into entrance reveal", async () => {
  const main = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");

  assert.match(main, /root\.closest\("#jestei-subscription"\)\s*!==\s*null/);
});
