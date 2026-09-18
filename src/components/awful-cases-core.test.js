import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTION_ORDER,
  ACTIONS,
  sessionAccuracy,
} from "./awful-cases-core.js";

test("every trainer action has a unique game key and app key", () => {
  const codes = ACTION_ORDER.map((type) => ACTIONS[type].code);
  const appKeys = ACTION_ORDER.map((type) => ACTIONS[type].appKey);
  assert.equal(new Set(codes).size, ACTION_ORDER.length);
  assert.equal(new Set(appKeys).size, ACTION_ORDER.length);
});

test("sessionAccuracy reports useful percentages", () => {
  assert.equal(sessionAccuracy({ correct: 0, mistakes: 0 }), 100);
  assert.equal(sessionAccuracy({ correct: 3, mistakes: 1 }), 75);
  assert.equal(sessionAccuracy({ correct: 1, mistakes: 2 }), 33);
});
