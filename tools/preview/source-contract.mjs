const EXACT_SHA = /^[0-9a-f]{40}$/;
const CMS_ID = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

export const DEFAULT_CMS_PREVIEW_TTL_HOURS = 72;

function requireExactSha(value, label) {
  if (!EXACT_SHA.test(String(value ?? ""))) throw new Error(`${label} must be an exact 40-char SHA`);
  return String(value);
}

export function normalizeSelectedPrNumbers(values = []) {
  const numbers = [...new Set(values.map((value) => Number(value)))];
  if (numbers.some((value) => !Number.isSafeInteger(value) || value < 1 || value > 999999)) {
    throw new Error("selected PR numbers must be positive bounded integers");
  }
  return numbers.sort((a, b) => a - b);
}

function normalizePath(value) {
  const path = String(value ?? "").replaceAll("\\", "/").replace(/^\.\//, "");
  if (!path || path.startsWith("/") || path.includes("../") || path === "..") {
    throw new Error(`unsafe repository path: ${value}`);
  }
  return path;
}

export function planLabComposition({ repository, devSha, selectedPrs = [] }) {
  if (!repository || repository.includes(" ")) throw new Error("repository is required");
  const baseSha = requireExactSha(devSha, "devSha");
  const seen = new Set();
  const prs = selectedPrs.map((pr) => {
    const number = Number(pr.number);
    if (!Number.isSafeInteger(number) || number < 1 || seen.has(number)) throw new Error("PR identity must be unique and positive");
    seen.add(number);
    if (pr.state !== "open") throw new Error(`PR #${number} is not open`);
    if (pr.headRepo !== repository) throw new Error(`PR #${number} is not same-repo`);
    return { number, sha: requireExactSha(pr.headSha, `PR #${number} head`) };
  }).sort((a, b) => a.number - b.number);

  return {
    kind: "lab",
    generated: true,
    baseBranch: "dev",
    baseSha,
    targetBranch: "lab",
    prs,
    conflictPolicy: "abort-keep-known-good",
    promotableToDev: false,
  };
}

export function planCmsPreview({
  id,
  baseBranch = "dev",
  allowLabBase = false,
  changedPaths = [],
  authorizedPrefixes = [],
  ttlHours = DEFAULT_CMS_PREVIEW_TTL_HOURS,
}) {
  if (!CMS_ID.test(String(id ?? ""))) throw new Error("CMS preview id must be lowercase, bounded and URL-safe");
  if (baseBranch !== "dev" && !(baseBranch === "lab" && allowLabBase)) {
    throw new Error("CMS preview base must be dev unless explicit lab advanced mode is enabled");
  }
  if (!Number.isInteger(ttlHours) || ttlHours < 1 || ttlHours > DEFAULT_CMS_PREVIEW_TTL_HOURS) {
    throw new Error(`CMS preview TTL must be 1-${DEFAULT_CMS_PREVIEW_TTL_HOURS} hours`);
  }
  const prefixes = authorizedPrefixes.map((prefix) => normalizePath(prefix).replace(/\/?$/, "/"));
  const paths = changedPaths.map(normalizePath);
  for (const path of paths) {
    if (!prefixes.some((prefix) => path.startsWith(prefix))) throw new Error(`CMS preview path is not authorized: ${path}`);
  }
  return {
    kind: "cms",
    ref: `cms-preview/${id}`,
    baseBranch,
    changedPaths: [...new Set(paths)].sort(),
    ttlHours,
    publishAuthority: false,
    providerAuthority: false,
  };
}
