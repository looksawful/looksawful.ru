const CONTENT_BRANCH = /^content\/[A-Za-z0-9._/-]+$/;

export function authorizeContentDeskWrite(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, reason: "missing-provenance" };
  }

  if (input.ci) return { ok: false, reason: "ci-blocked" };
  if (input.host !== "127.0.0.1") return { ok: false, reason: "loopback-required" };
  if (input.baseBranch !== "prod") return { ok: false, reason: "prod-base-required" };
  if (!input.baseIsFresh) return { ok: false, reason: "stale-prod-base" };
  if (input.branch === "prod" || input.branch === "dev") {
    return { ok: false, reason: "protected-branch" };
  }
  if (input.branch === "content/text-cms") {
    return { ok: false, reason: "permanent-authoring-branch-disallowed" };
  }
  if (typeof input.branch !== "string" || !CONTENT_BRANCH.test(input.branch)) {
    return { ok: false, reason: "temporary-content-branch-required" };
  }

  return { ok: true, reason: "authorized" };
}
