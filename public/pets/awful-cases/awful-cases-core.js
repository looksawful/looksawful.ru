export const ACTIONS = Object.freeze({
  upper: Object.freeze({ code: "ArrowUp", label: "↑", appKey: "Up" }),
  lower: Object.freeze({ code: "ArrowDown", label: "↓", appKey: "Down" }),
  toggle: Object.freeze({ code: "ArrowRight", label: "→", appKey: "Right" }),
  title: Object.freeze({ code: "ArrowLeft", label: "←", appKey: "Left" }),
  lint: Object.freeze({ code: "PageDown", label: "PgDn", appKey: "PgDn" }),
  sentence: Object.freeze({ code: "Delete", label: "Del", appKey: "Delete" }),
});

export const ACTION_ORDER = Object.freeze([
  "upper",
  "lower",
  "toggle",
  "title",
  "lint",
  "sentence",
]);

const PRACTICE_ORDER = Object.freeze(["toggle", "lint", "upper", "sentence", "lower", "title"]);

const EXAM_ORDER = Object.freeze(["sentence", "upper", "title", "lint", "toggle", "lower"]);

function phaseEntries(phase, order) {
  return order.map((type) => Object.freeze({ type, phase }));
}

export const SESSION_PLAN = Object.freeze([
  ...phaseEntries("tutorial", ACTION_ORDER),
  ...phaseEntries("practice", PRACTICE_ORDER),
  ...phaseEntries("exam", EXAM_ORDER),
]);

export function phaseForIndex(index) {
  if (index < ACTION_ORDER.length) return "tutorial";
  if (index < ACTION_ORDER.length + PRACTICE_ORDER.length) return "practice";
  return "exam";
}

export function actionFromCode(code) {
  for (const type of ACTION_ORDER) {
    if (ACTIONS[type].code === code) return type;
  }
  return null;
}

export function createSessionStats() {
  return {
    resolved: 0,
    correct: 0,
    mistakes: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
  };
}

export function recordCorrect(stats) {
  const streak = stats.streak + 1;
  const bonus = Math.min(100, Math.max(0, streak - 1) * 25);
  return {
    ...stats,
    resolved: stats.resolved + 1,
    correct: stats.correct + 1,
    score: stats.score + 100 + bonus,
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
  };
}

export function recordMistake(stats, { resolve = false } = {}) {
  return {
    ...stats,
    resolved: stats.resolved + (resolve ? 1 : 0),
    mistakes: stats.mistakes + 1,
    streak: 0,
  };
}

export function missIsLethal(phase) {
  return phase === "exam";
}
