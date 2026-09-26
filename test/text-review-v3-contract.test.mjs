import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDecisionLocks,
  resolveDecisionLock
} from "../tools/supabase/text-review-v3/contract.mjs";

const context = { pageId: "jestei-pool", section: "Фильтр", role: "Заголовок", kind: "copy" };
const prior = ({
  decision_id = "round_2_2026_09_22:r2-filter",
  chosen_text = "Фильтр",
  metadata = {}
} = {}) => ({
  decision_id,
  source_round: "round_2_2026_09_22",
  source_item_id: "r2-filter",
  original_text: "Фильтр",
  chosen_text,
  chosen_option: "keep",
  custom_text: "",
  metadata: {
    recovery_status: "confirmed",
    context,
    stale: false,
    synthetic: false,
    aggregate: false,
    ...metadata
  }
});

const item = ({ source = "Фильтр", sourceMismatch = false, overrides = {} } = {}) => ({
  id: "r3-filter",
  ...context,
  current: { source, production: sourceMismatch ? "Filter" : source, sourceMismatch },
  priorDecision: {
    decisionId: "round_2_2026_09_22:r2-filter",
    sourceRound: "round_2_2026_09_22",
    sourceItemId: "r2-filter"
  },
  ...overrides
});

test("unchanged exact source and material context inherit the explicit prior decision", () => {
  const state = resolveDecisionLock(item(), prior());
  assert.equal(state.status, "inherited");
  assert.equal(state.chosenText, "Фильтр");
});

test("changed source text invalidates inheritance", () => {
  assert.deepEqual(resolveDecisionLock(item({ source: "Фильтры" }), prior()).status, "review");
  assert.equal(resolveDecisionLock(item({ source: "Фильтры" }), prior()).reason, "source_changed");
});

test("changed semantic context invalidates inheritance even when text is identical", () => {
  const changed = item({ overrides: { section: "Навигация" } });
  const state = resolveDecisionLock(changed, prior());
  assert.equal(state.status, "review");
  assert.equal(state.reason, "context_changed");
});

test("stale synthetic aggregated or unconfirmed prior decisions never auto-inherit", () => {
  for (const metadata of [
    { stale: true },
    { synthetic: true },
    { aggregate: true },
    { recovery_status: "needs_review" }
  ]) {
    assert.equal(resolveDecisionLock(item(), prior({ metadata })).status, "review");
  }
});

test("production/source drift is reported but does not redefine source authority", () => {
  const state = resolveDecisionLock(item({ sourceMismatch: true }), prior());
  assert.equal(state.status, "inherited");
  assert.equal(state.sourceMismatch, true);
});

test("persisted Round 3 answer overrides an otherwise inheritable prior decision", () => {
  const state = buildDecisionLocks(
    [{ item_id: "r3-filter", option_id: "strong", custom_text: "", updated_at: "2026-09-26T00:00:00Z" }],
    [prior()],
    [item()]
  );
  assert.equal(state.states["r3-filter"].status, "answered");
  assert.equal(state.states["r3-filter"].answer.option_id, "strong");
  assert.equal(state.progress.inherited, 0);
});

test("fact checks stay distinct from copy decision inheritance", () => {
  const fact = item({ overrides: { id: "r3-fact", kind: "fact" } });
  const state = resolveDecisionLock(fact, prior({ metadata: { context: { ...context, kind: "fact" } } }));
  assert.equal(state.status, "review");
  assert.equal(state.reason, "fact_check_requires_review");
});
