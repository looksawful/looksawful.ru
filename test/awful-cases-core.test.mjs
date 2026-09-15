import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTION_ORDER,
  ACTIONS,
  SESSION_PLAN,
  actionFromCode,
  createSessionStats,
  missIsLethal,
  phaseForIndex,
  recordCorrect,
  recordMistake,
} from "../src/components/awful-cases-core.js";

test("Awful Cases exposes the six real training actions", () => {
  assert.deepEqual(ACTION_ORDER, ["upper", "lower", "toggle", "title", "lint", "sentence"]);
  assert.deepEqual(ACTIONS.upper, { code: "ArrowUp", label: "↑", appKey: "Up" });
  assert.deepEqual(ACTIONS.lower, { code: "ArrowDown", label: "↓", appKey: "Down" });
  assert.deepEqual(ACTIONS.toggle, { code: "ArrowRight", label: "→", appKey: "Right" });
  assert.deepEqual(ACTIONS.title, { code: "ArrowLeft", label: "←", appKey: "Left" });
  assert.deepEqual(ACTIONS.lint, { code: "PageDown", label: "PgDn", appKey: "PgDn" });
  assert.deepEqual(ACTIONS.sentence, { code: "Delete", label: "Del", appKey: "Delete" });
});

test("Awful Cases session has tutorial, practice and exam phases", () => {
  assert.equal(SESSION_PLAN.length, 18);
  assert.deepEqual(SESSION_PLAN.slice(0, 6).map(({ type }) => type), ACTION_ORDER);
  assert.equal(SESSION_PLAN.filter(({ phase }) => phase === "tutorial").length, 6);
  assert.equal(SESSION_PLAN.filter(({ phase }) => phase === "practice").length, 6);
  assert.equal(SESSION_PLAN.filter(({ phase }) => phase === "exam").length, 6);
  assert.equal(phaseForIndex(0), "tutorial");
  assert.equal(phaseForIndex(6), "practice");
  assert.equal(phaseForIndex(12), "exam");
  assert.equal(phaseForIndex(999), "exam");
});

test("physical keys resolve to semantic actions", () => {
  assert.equal(actionFromCode("ArrowUp"), "upper");
  assert.equal(actionFromCode("ArrowDown"), "lower");
  assert.equal(actionFromCode("ArrowRight"), "toggle");
  assert.equal(actionFromCode("ArrowLeft"), "title");
  assert.equal(actionFromCode("PageDown"), "lint");
  assert.equal(actionFromCode("Delete"), "sentence");
  assert.equal(actionFromCode("KeyA"), null);
});

test("session stats reward correctness and bounded streaks", () => {
  let stats = createSessionStats();
  assert.deepEqual(stats, {
    resolved: 0,
    correct: 0,
    mistakes: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
  });

  stats = recordCorrect(stats);
  assert.deepEqual(stats, {
    resolved: 1,
    correct: 1,
    mistakes: 0,
    score: 100,
    streak: 1,
    bestStreak: 1,
  });

  stats = recordCorrect(stats);
  assert.equal(stats.score, 225);
  assert.equal(stats.streak, 2);
  assert.equal(stats.bestStreak, 2);
});

test("mistakes reset streak and recovered misses resolve without credit", () => {
  let stats = recordCorrect(createSessionStats());
  stats = recordMistake(stats);
  assert.equal(stats.resolved, 1);
  assert.equal(stats.correct, 1);
  assert.equal(stats.mistakes, 1);
  assert.equal(stats.streak, 0);
  assert.equal(stats.score, 100);

  stats = recordMistake(stats, { resolve: true });
  assert.equal(stats.resolved, 2);
  assert.equal(stats.correct, 1);
  assert.equal(stats.mistakes, 2);
  assert.equal(stats.streak, 0);
});

test("only exam misses are lethal", () => {
  assert.equal(missIsLethal("tutorial"), false);
  assert.equal(missIsLethal("practice"), false);
  assert.equal(missIsLethal("exam"), true);
});
