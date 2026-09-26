export const ROUND_ID = "round_3_2026_09_26";

const CONTEXT_KEYS = ["pageId", "section", "role", "kind"];

const text = (value) => (typeof value === "string" ? value : "");

export function materialContext(value = {}) {
  return Object.fromEntries(CONTEXT_KEYS.map((key) => [key, text(value?.[key])]));
}

export function sameMaterialContext(left, right) {
  if (!left || !right) return false;
  return CONTEXT_KEYS.every((key) => text(left[key]) === text(right[key]) && text(left[key]) !== "");
}

export function priorDecisionEligibility(decision) {
  if (!decision || typeof decision !== "object") return { ok: false, reason: "prior_missing" };
  const metadata = decision.metadata && typeof decision.metadata === "object" ? decision.metadata : {};
  if (metadata.recovery_status !== "confirmed") return { ok: false, reason: "prior_unconfirmed" };
  if (metadata.stale === true) return { ok: false, reason: "prior_stale" };
  if (metadata.synthetic === true) return { ok: false, reason: "prior_synthetic" };
  if (metadata.aggregate === true) return { ok: false, reason: "prior_aggregate" };
  if (!sameMaterialContext(metadata.context, materialContext(metadata.context))) {
    return { ok: false, reason: "prior_context_missing" };
  }
  return { ok: true };
}

function priorLinkMatches(item, decision) {
  const link = item?.priorDecision;
  if (!link?.decisionId || link.decisionId !== decision.decision_id) return false;
  if (link.sourceRound && link.sourceRound !== decision.source_round) return false;
  if (link.sourceItemId && link.sourceItemId !== decision.source_item_id) return false;
  return true;
}

export function resolveDecisionLock(item, priorDecision) {
  const source = item?.current?.source;
  const sourceMismatch = Boolean(item?.current?.sourceMismatch);
  const base = { sourceMismatch };

  if (!item || typeof item !== "object") return { ...base, status: "review", reason: "invalid_item" };
  if (item.kind === "fact") return { ...base, status: "review", reason: "fact_check_requires_review" };
  if (!priorDecision) return { ...base, status: "review", reason: "prior_missing" };
  if (!priorLinkMatches(item, priorDecision)) return { ...base, status: "review", reason: "prior_link_mismatch" };

  const eligibility = priorDecisionEligibility(priorDecision);
  if (!eligibility.ok) return { ...base, status: "review", reason: eligibility.reason };

  if (!sameMaterialContext(materialContext(item), priorDecision.metadata.context)) {
    return { ...base, status: "review", reason: "context_changed" };
  }
  if (typeof source !== "string" || source !== priorDecision.chosen_text) {
    return { ...base, status: "review", reason: "source_changed" };
  }

  return {
    ...base,
    status: "inherited",
    decisionId: priorDecision.decision_id,
    sourceRound: priorDecision.source_round,
    sourceItemId: priorDecision.source_item_id,
    chosenText: priorDecision.chosen_text,
    chosenOption: priorDecision.chosen_option,
    customText: priorDecision.custom_text || ""
  };
}

export function buildDecisionLocks(persistedAnswers = [], priorDecisions = [], items = []) {
  const answers = new Map((persistedAnswers || []).map((answer) => [answer.item_id, answer]));
  const priors = new Map((priorDecisions || []).map((decision) => [decision.decision_id, decision]));
  const states = {};

  for (const item of items || []) {
    const persisted = answers.get(item.id);
    if (persisted) {
      states[item.id] = {
        status: "answered",
        sourceMismatch: Boolean(item?.current?.sourceMismatch),
        answer: { ...persisted, inherited: false }
      };
      continue;
    }
    const prior = item?.priorDecision?.decisionId ? priors.get(item.priorDecision.decisionId) : undefined;
    states[item.id] = resolveDecisionLock(item, prior);
  }

  return {
    states,
    progress: {
      total: items.length,
      answered: items.filter((item) => states[item.id]?.status === "answered").length,
      inherited: items.filter((item) => states[item.id]?.status === "inherited").length,
      review: items.filter((item) => states[item.id]?.status === "review").length
    }
  };
}
