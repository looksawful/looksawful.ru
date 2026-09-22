import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sitePages } from "../../src/site/pages/manifest.ts";

import { sitePages } from "../../src/site/pages/manifest.ts";

const REVIEW_DEPTHS = Object.freeze(["quick", "interactive", "full"]);
const REVIEW_DEPTH_RANK = new Map(REVIEW_DEPTHS.map((depth, index) => [depth, index]));
const reviewCases = sitePages
  .filter((page) => page.enabled && page.build.kind === "vite" && page.type !== "not-found")
  .map((page) => ({
    id: page.id,
    path: page.path,
    entityId: "entityId" in page ? page.entityId : null,
  }));
const ALL_REVIEW_CASE_IDS = Object.freeze(reviewCases.map((item) => item.id).sort());

const CLEARLY_NON_VISUAL_REVIEW_PATH = /^(docs\/|test\/|\.agents\/|\.github\/|tools\/ci\/|tools\/supabase\/|tools\/lab\/|lab\/|src\/lab\/|AGENTS\.md$|README[^/]*$|LICENSE$|CONTENT_RIGHTS\.md$|\.editorconfig$|\.gitignore$|\.gitattributes$)/;
const SHARED_VISUAL_REVIEW_PATH = /^(src\/content\/navigation\.json$|src\/data\/navigation\.ts$|src\/(main\.|interactive\.|motion\/|components\/|templates\/|site\/(shell|renderers)\/)|src\/styles\/|index\.html$|404\.html$)/;
const INTERACTIVE_VISUAL_REVIEW_PATH = /^(work\/|gallery\/|shootings\/|src\/(components\/|templates\/|motion\/|site\/renderers\/|styles\/))/;

function normalizeChangedFiles(files) {
  return [...new Set(files.map((file) => file.replaceAll("\\", "/")).filter(Boolean))].sort();
}

function ownedReviewCases(file) {
  const basename = file.split("/").at(-1) ?? file;
  const owned = [];
  for (const reviewCase of reviewCases) {
    const routePath = reviewCase.path.replace(/^\/+|\/+$/g, "");
    if (routePath && (file === routePath || file.startsWith(`${routePath}/`))) {
      owned.push(reviewCase.id);
      continue;
    }

    const entityId = reviewCase.entityId;
    if (!entityId) continue;
    if (
      file.includes(`/${entityId}.`) ||
      file.includes(`/${entityId}/`) ||
      basename.startsWith(`${entityId}-`)
    ) {
      owned.push(reviewCase.id);
    }
  }
  return [...new Set(owned)].sort();
}

function deeperReviewDepth(current, candidate) {
  if (!current) return candidate;
  return REVIEW_DEPTH_RANK.get(candidate) > REVIEW_DEPTH_RANK.get(current) ? candidate : current;
}

function validateEscalation({ escalateDepth, escalateCases }) {
  if (escalateDepth !== undefined && !REVIEW_DEPTH_RANK.has(escalateDepth)) {
    throw new Error(`Unknown visual review depth: ${escalateDepth}`);
  }
  for (const caseId of escalateCases ?? []) {
    if (!ALL_REVIEW_CASE_IDS.includes(caseId)) {
      throw new Error(`Unknown visual review Case: ${caseId}`);
    }
  }
}

export function classifyVisualReview(files, { escalateDepth, escalateCases = [] } = {}) {
  validateEscalation({ escalateDepth, escalateCases });
  const changedFiles = normalizeChangedFiles(files);
  const visualFiles = changedFiles.filter((file) => !CLEARLY_NON_VISUAL_REVIEW_PATH.test(file));
  const affectedCases = new Set();
  let reviewDepth = null;

  for (const file of visualFiles) {
    const ownedCases = ownedReviewCases(file);
    if (SHARED_VISUAL_REVIEW_PATH.test(file)) {
      for (const caseId of ALL_REVIEW_CASE_IDS) affectedCases.add(caseId);
      reviewDepth = deeperReviewDepth(reviewDepth, "full");
      continue;
    }

    if (ownedCases.length > 0) {
      for (const caseId of ownedCases) affectedCases.add(caseId);
      reviewDepth = deeperReviewDepth(
        reviewDepth,
        INTERACTIVE_VISUAL_REVIEW_PATH.test(file) ? "interactive" : "quick",
      );
      continue;
    }

    for (const caseId of ALL_REVIEW_CASE_IDS) affectedCases.add(caseId);
    reviewDepth = deeperReviewDepth(
      reviewDepth,
      INTERACTIVE_VISUAL_REVIEW_PATH.test(file) ? "full" : "quick",
    );
  }

  const explicitlyEscalated = escalateDepth !== undefined || escalateCases.length > 0;
  if (explicitlyEscalated && reviewDepth === null) reviewDepth = "quick";
  if (reviewDepth !== null && affectedCases.size === 0) {
    for (const caseId of ALL_REVIEW_CASE_IDS) affectedCases.add(caseId);
  }
  for (const caseId of escalateCases) affectedCases.add(caseId);
  if (escalateDepth !== undefined) {
    reviewDepth = deeperReviewDepth(reviewDepth ?? "quick", escalateDepth);
  }

  return {
    visual: reviewDepth !== null,
    affectedCases: [...affectedCases].sort(),
    reviewDepth,
  };
}

const REVIEW_DEPTH_ORDER = Object.freeze({
  quick: 0,
  interactive: 1,
  full: 2,
});

const reviewableCases = sitePages
  .filter((page) => page.enabled && page.build.kind === "vite" && page.type !== "not-found")
  .map((page) => ({
    id: page.id,
    entityId: "entityId" in page ? page.entityId : null,
  }));

const reviewableCaseIds = Object.freeze(reviewableCases.map((item) => item.id).sort());
const reviewableCaseIdSet = new Set(reviewableCaseIds);

function normalizeChangedFiles(files) {
  return [...new Set(files.map((file) => file.replaceAll("\\", "/")).filter(Boolean))].sort();
}

function affectedCasesForFile(file) {
  const exact = reviewableCases
    .filter(({ entityId }) => entityId && file.includes(entityId))
    .map(({ id }) => id);

  if (exact.length > 0) return exact;
  if (/\/(?:home)(?:\/|\.|-)/u.test(file) || /home-project-cards/u.test(file)) return ["home"];
  if (/\/(?:gallery)(?:\/|\.|-)/u.test(file)) return ["gallery"];
  return [];
}

function strongestReviewDepth(current, candidate) {
  if (!candidate) return current;
  if (!(candidate in REVIEW_DEPTH_ORDER)) {
    throw new TypeError(`Unknown visual review depth: ${candidate}`);
  }
  if (!current || REVIEW_DEPTH_ORDER[candidate] > REVIEW_DEPTH_ORDER[current]) return candidate;
  return current;
}

function validateEscalationCases(cases) {
  if (cases === undefined) return [];
  if (!Array.isArray(cases)) throw new TypeError("Visual review escalation cases must be an array");
  for (const caseId of cases) {
    if (!reviewableCaseIdSet.has(caseId)) {
      throw new TypeError(`Unknown visual review Case: ${caseId}`);
    }
  }
  return cases;
}

export function classifyVisualReview(
  files,
  { escalateDepth, escalateCases } = {},
) {
  const changedFiles = normalizeChangedFiles(files);
  const affectedCases = new Set();
  let visual = false;
  let reviewDepth = null;

  for (const file of changedFiles) {
    const localCases = affectedCasesForFile(file);
    const isUserVisibleText = /^(?:src\/(?:content\/|data\/content\/)|work\/|shootings\/)/u.test(file);
    const isSharedNavigation = /^(?:src\/content\/navigation\.json|src\/(?:components\/site-nav|site\/navigation\/|site\/shell\/navigation)|src\/styles\/(?:site-nav|project-navigation))/u.test(file);
    const isSharedVisualRuntime = /^(?:src\/(?:main\.|interactive\.|motion\/|components\/|templates\/|styles\/|site\/renderers\/|site\/shell\/)|index\.html$|404\.html$)/u.test(file);
    const isClearlyNonVisual = /^(?:docs\/|AGENTS\.md$|\.agents\/|\.github\/|test\/|tools\/ci\/|lab\/|src\/lab\/)/u.test(file);

    if (isUserVisibleText) {
      visual = true;
      reviewDepth = strongestReviewDepth(reviewDepth, "quick");
      const targets = localCases.length > 0 ? localCases : reviewableCaseIds;
      for (const caseId of targets) affectedCases.add(caseId);
      continue;
    }

    if (isSharedNavigation) {
      visual = true;
      reviewDepth = strongestReviewDepth(reviewDepth, "full");
      for (const caseId of reviewableCaseIds) affectedCases.add(caseId);
      continue;
    }

    if (isSharedVisualRuntime) {
      visual = true;
      reviewDepth = strongestReviewDepth(
        reviewDepth,
        localCases.length > 0 ? "interactive" : "full",
      );
      const targets = localCases.length > 0 ? localCases : reviewableCaseIds;
      for (const caseId of targets) affectedCases.add(caseId);
      continue;
    }

    if (isClearlyNonVisual) continue;

    // Ambiguity fails safe to a targeted Quick review rather than silently skipping.
    visual = true;
    reviewDepth = strongestReviewDepth(reviewDepth, "quick");
    const targets = localCases.length > 0 ? localCases : reviewableCaseIds;
    for (const caseId of targets) affectedCases.add(caseId);
  }

  const manualCases = validateEscalationCases(escalateCases);
  if (escalateDepth !== undefined || manualCases.length > 0) {
    visual = true;
    reviewDepth = strongestReviewDepth(reviewDepth, escalateDepth ?? "quick");
    for (const caseId of manualCases) affectedCases.add(caseId);
  }

  return {
    visual,
    affectedCases: visual ? [...affectedCases].sort() : [],
    reviewDepth: visual ? (reviewDepth ?? "quick") : null,
  };
}

// Specific ownership precedes broad runtime rules. Unknown files fail closed.
const rules = [
  ["cv", /^(public\/cv\/|src\/(content\/cv[^/]*|data\/cv[^/]*)|tools\/(apply-cv-content|prepare-cv-production|smoke-cv)\.mjs$|tools\/lib\/cv-content\.mjs$|test\/cv-)/],
  ["navigation", /^(src\/(content\/navigation\.json|data\/navigation\.ts|components\/site-nav[^/]*|styles\/(?:site-nav|project-navigation)[^/]*)|test\/(site-navigation|navigation-labels|project-navigation)|tools\/smoke-site-navigation\.mjs$)/],
  ["media-desk", /^(src\/(?:devtools|tools)\/media-desk\/|tools\/media-desk\/|tools\/e2e\/run-media-desk\.mjs$|test\/media-desk)/],
  ["media-tooling", /^(tools\/(build-responsive-media|build-video-media|media-dev-state|sync-media-catalog)\.mjs$|test\/(media-|responsive-|video-delivery))/],
  ["media", /^(public\/media\/|media\/|src\/content\/(media-catalog\/|projects\.json$)|src\/data\/media\/|src\/types\/media\.ts$)/],
  ["dependencies", /^package(-lock)?\.json$/],
  ["project-pages", /^(work\/(awful-cases|awful-mockups|moves-awful|berry-social-content-2020)\/|src\/content\/pages\/projects\/awful-mockups\.ts$|src\/data\/content\/awful-mockups\.ts$|src\/(content|data\/content)\/(awful-cases|moves-awful|berry)[^/]*|test\/(awful-cases|awful-mockups|moves-awful|berry)|tools\/smoke-project-pages\.mjs$)/],
  ["shared-runtime", /^(src\/(main\.|interactive\.|motion\/|components\/|templates\/|types\/|site\/|styles\/(index|base|tokens|layout|reset|components)\.)|tools\/(e2e\/|ci\/change-scope\.mjs$|smoke-site\.mjs$|smoke-mpa\.mjs$|capture-caption-qa\.mjs$))/],
  ["build-config", /^(vite\.config\.|tsconfig[^/]*|\.pages\.yml$|index\.html$|404\.html$|tools\/(generate-sitemap|check-site-meta|check-local-links|site-html-utils)\.mjs$)/],
  ["styles", /^src\/styles\//],
  ["content", /^(src\/(content\/|data\/)|work\/|shootings\/|test\/(domain-catalog-identity|jestei|styx|sensetique|shootings|client|project-card))/],
  ["ci", /^(\.github\/|\.agents\/|tools\/ci\/|test\/(ci-pipeline|change-scope|e2e-concurrency|tooling-pipeline)\.test\.mjs$|docs\/|AGENTS\.md$|README[^/]*$|\.editorconfig$|\.gitignore$|\.gitattributes$)/],
];

export function classifyChangedFiles(files, { full = false, review = {} } = {}) {
  const changedFiles = normalizeChangedFiles(files);
  const groups = [...new Set(changedFiles.map((file) => rules.find(([, pattern]) => pattern.test(file))?.[0] ?? "unknown"))].sort();
  const broad = full || groups.some((group) => ["shared-runtime", "build-config", "dependencies", "unknown"].includes(group));
  const mediaChanged = full || groups.some((group) => ["media", "media-tooling", "dependencies", "unknown"].includes(group));
  const mediaDeskChanged = broad || groups.includes("media-desk") || groups.includes("media");
  const mediaToolingOnly = groups.includes("media-tooling") && groups.every((group) => ["ci", "media-tooling"].includes(group));
  const suites = new Set(mediaToolingOnly ? [] : ["smoke"]);
  const visualReview = classifyVisualReview(
    changedFiles,
    full ? { ...review, escalateDepth: "full" } : review,
  );
  if (groups.includes("cv")) suites.add("cv");
  if (groups.includes("navigation")) suites.add("navigation");
  if (groups.includes("project-pages")) suites.add("project-pages");
  if (groups.some((group) => ["media", "media-tooling"].includes(group))) suites.add("media");
  if (groups.some((group) => ["content", "styles"].includes(group))) suites.add("mpa");
  if (groups.includes("styles")) suites.add("project-pages");
  return {
    changedFiles,
    groups,
    mediaChanged,
    mediaDeskChanged,
    visualReview,
    suites: broad ? ["full"] : [...suites],
    scope: broad ? "full" : "affected",
  };
}

function commitIsAvailable(ref) {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ensureCommitAvailable(ref) {
  if (!ref || /^0+$/.test(ref) || commitIsAvailable(ref)) return;

  // Shallow CI checkouts intentionally contain only the checked-out SHA. Fetch
  // the exact comparison revision instead of downloading every branch/tag and
  // the entire repository history. Any fetch/validation failure remains fatal.
  execFileSync("git", ["fetch", "--no-tags", "--depth=1", "origin", ref], { stdio: "inherit" });
  if (!commitIsAvailable(ref)) {
    throw new Error(`Fetched comparison revision is still unavailable: ${ref}`);
  }
}

export function scopeFromGit({ base, head = "HEAD", mergeBase = false, full = false } = {}) {
  if (full || !base || /^0+$/.test(base)) return classifyChangedFiles([], { full: true });
  // Invalid/unavailable revisions fail the job; they never silently shrink scope.
  ensureCommitAvailable(base);
  ensureCommitAvailable(head);
  const range = `${base}${mergeBase ? "..." : ".."}${head}`;
  execFileSync("git", ["diff", "--check", range], { stdio: "inherit" });
  const diff = execFileSync("git", ["diff", "--name-only", "-z", range], { encoding: "utf8" });
  return classifyChangedFiles(diff.split("\0"));
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const value = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  const scope = args.includes("--files")
    ? classifyChangedFiles(JSON.parse(readFileSync(value("--files"), "utf8")))
    : scopeFromGit({ base: value("--base") ?? process.env.CI_DIFF_BASE, head: value("--head") ?? process.env.CI_DIFF_HEAD ?? "HEAD", mergeBase: args.includes("--merge-base"), full: args.includes("--full") });
  console.log(JSON.stringify(scope, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `media_inputs_changed=${scope.mediaChanged}\nmedia_desk_changed=${scope.mediaDeskChanged}\ne2e_scope=${scope.scope}\naffected_suites=${scope.suites.join(",")}\ngroups=${scope.groups.join(",")}\nchanged_count=${scope.changedFiles.length}\nvisual_impact=${scope.visualReview.visual}\nvisual_cases=${scope.visualReview.affectedCases.join(",")}\nvisual_review_depth=${scope.visualReview.reviewDepth ?? "none"}\n`,
    );
  }
}
