import assert from "node:assert/strict";
import test from "node:test";

import { mountWorkArchive } from "../src/components/work-archive.ts";

function createDetails() {
  const listeners = new Map();
  return {
    open: false,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    dispatch(type) {
      listeners.get(type)?.();
    },
    hasListener(type) {
      return listeners.has(type);
    },
  };
}

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    value(key) {
      return values.get(key) ?? null;
    },
  };
}

test("Work Archive restores and persists disclosure state in session storage", () => {
  const details = createDetails();
  const root = {
    querySelector(selector) {
      assert.equal(selector, "[data-work-archive]");
      return details;
    },
  };
  const storage = createStorage({ "portfolio:work-archive-open": "1" });

  const destroy = mountWorkArchive(root, storage);
  assert.equal(details.open, true);
  assert.equal(details.hasListener("toggle"), true);

  details.open = false;
  details.dispatch("toggle");
  assert.equal(storage.value("portfolio:work-archive-open"), "0");

  details.open = true;
  details.dispatch("toggle");
  assert.equal(storage.value("portfolio:work-archive-open"), "1");

  destroy();
  assert.equal(details.hasListener("toggle"), false);
});

test("Work Archive remains usable when session storage throws", () => {
  const details = createDetails();
  const root = { querySelector: () => details };
  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.doesNotThrow(() => {
    const destroy = mountWorkArchive(root, storage);
    details.open = true;
    details.dispatch("toggle");
    destroy();
  });
});
