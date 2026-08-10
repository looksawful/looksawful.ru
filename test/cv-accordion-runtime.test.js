import test from "node:test";
import assert from "node:assert/strict";

class FakeElement {
  closest() { return this; }
}
class FakeHTMLElement extends FakeElement {}

globalThis.Element = FakeElement;
globalThis.HTMLElement = FakeHTMLElement;

const listeners = new Map();
globalThis.document = {
  visibilityState: "visible",
  addEventListener(type, listener) {
    listeners.set(type, listener);
  },
  removeEventListener(type, listener) {
    if (listeners.get(type) === listener) listeners.delete(type);
  },
};

const { createCvAccordionRuntime } = await import(
  "../src/components/cv-accordion/cv-accordion-runtime.js"
);

function makeRuntime(count = 3) {
  const records = Array.from({ length: count }, () => ({
    item: new FakeHTMLElement(),
  }));
  return { records, runtime: createCvAccordionRuntime({ records }) };
}
test("runtime exposes exactly one active index to direct scene subscribers", () => {
  const { runtime } = makeRuntime();
  const seen0 = [];
  const seen1 = [];
  runtime.subscribeScene(0, (state) => seen0.push(state.active));
  runtime.subscribeScene(1, (state) => seen1.push(state.active));

  runtime.setActiveIndex(0);
  assert.equal(runtime.activeIndex, 0);
  runtime.setActiveIndex(1);
  assert.equal(runtime.activeIndex, 1);

  assert.deepEqual(seen0, [false, true, false]);
  assert.deepEqual(seen1, [false, true]);
  runtime.destroy();
});

test("runtime owns one document visibility listener and removes it on destroy", () => {
  const { runtime } = makeRuntime(1);
  const seen = [];
  runtime.subscribeScene(0, (state) => seen.push(state.documentVisible));

  assert.equal(typeof listeners.get("visibilitychange"), "function");
  document.visibilityState = "hidden";
  listeners.get("visibilitychange")();
  assert.equal(runtime.documentVisible, false);
  assert.equal(seen.at(-1), false);

  runtime.destroy();
  assert.equal(listeners.has("visibilitychange"), false);
  document.visibilityState = "visible";
});

test("frame and invalidation subscriptions are direct and scoped", () => {
  const { runtime } = makeRuntime();
  const frames = [];
  const invalidations = [];
  runtime.subscribeFrame(1, (frame, index) => frames.push([frame.progress, index]));
  runtime.subscribeInvalidation((index) => invalidations.push(index));

  runtime.publishFrame({ progress: 0.4 }, [0]);
  assert.deepEqual(frames, []);
  runtime.publishFrame({ progress: 0.5 }, [1]);
  assert.deepEqual(frames, [[0.5, 1]]);
  runtime.invalidate(1);
  assert.deepEqual(invalidations, [1]);
  runtime.destroy();
});
