import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Specific ownership precedes broad runtime rules. Unknown files fail closed.
const rules = [
  ["cv", /^(public\/cv\/|src\/(content\/cv[^/]*|data\/cv[^/]*)|tools\/(apply-cv-content|prepare-cv-production|smoke-cv)\.mjs$|tools\/lib\/cv-content\.mjs$|test\/cv-)/],
  ["navigation", /^(src\/(content\/navigation\.json|data\/navigation\.ts|components\/site-nav[^/]*|styles\/site-nav[^/]*)|test\/(site-navigation|navigation-labels|project-navigation)|tools\/smoke-site-navigation\.mjs$)/],
  ["media", /^(public\/media\/|media\/|src\/content\/(media-catalog\/|projects\.json$)|src\/data\/media\/|src\/types\/media\.ts$|tools\/(build-responsive-media|build-video-media|media-dev-state|sync-media-catalog)\.mjs$|test\/(media-|responsive-|video-delivery))/],
  ["media-desk", /^(src\/tools\/media-desk\/|tools\/media-desk\/|tools\/e2e\/run-media-desk\.mjs$|test\/media-desk)/],
  ["dependencies", /^package(-lock)?\.json$/],
  ["project-pages", /^(work\/(awful-cases|moves-awful|berry-social-content-2020)\/|src\/(content|data\/content)\/(awful-cases|moves-awful|berry)[^/]*|test\/(awful-cases|moves-awful|berry)|tools\/smoke-project-pages\.mjs$)/],
  ["shared-runtime", /^(src\/(main\.|interactive\.|motion\/|components\/|templates\/|types\/|site\/|styles\/(index|base|tokens|layout|reset|components)\.)|tools\/(e2e\/|ci\/change-scope\.mjs$|smoke-site\.mjs$|smoke-mpa\.mjs$|capture-caption-qa\.mjs$))/],
  ["build-config", /^(vite\.config\.|tsconfig[^/]*|\.pages\.yml$|index\.html$|404\.html$|tools\/(generate-sitemap|check-site-meta|check-local-links|site-html-utils)\.mjs$)/],
  ["styles", /^src\/styles\//],
  ["content", /^(src\/(content\/|data\/)|work\/|shootings\/|test\/(domain-catalog-identity|jestei|styx|sensetique|shootings|client|project-card))/],
  ["ci", /^(\.github\/|tools\/ci\/|test\/(ci-pipeline|change-scope|e2e-concurrency|tooling-pipeline)\.test\.mjs$|docs\/|AGENTS\.md$|README[^/]*$|\.editorconfig$|\.gitignore$|\.gitattributes$)/],
];

export function classifyChangedFiles(files, { full = false } = {}) {
  const changedFiles = [...new Set(files.map((file) => file.replaceAll("\\", "/")).filter(Boolean))].sort();
  const groups = [...new Set(changedFiles.map((file) => rules.find(([, pattern]) => pattern.test(file))?.[0] ?? "unknown"))].sort();
  const broad = full || groups.some((group) => ["shared-runtime", "build-config", "dependencies", "unknown"].includes(group));
  const mediaChanged = full || groups.some((group) => ["media", "dependencies", "unknown"].includes(group));
  const mediaDeskChanged = full || groups.includes("media-desk") || groups.includes("media");
  const suites = new Set(["smoke"]);
  if (groups.includes("cv")) suites.add("cv");
  if (groups.includes("navigation")) suites.add("navigation");
  if (groups.includes("project-pages")) suites.add("project-pages");
  if (groups.includes("media")) suites.add("media");
  if (groups.some((group) => ["content", "styles"].includes(group))) suites.add("mpa");
  if (groups.includes("styles")) suites.add("project-pages");
  return {
    changedFiles,
    groups,
    mediaChanged,
    mediaDeskChanged,
    suites: broad ? ["full"] : [...suites],
    scope: broad ? "full" : "affected",
  };
}

export function scopeFromGit({ base, head = "HEAD", mergeBase = false, full = false } = {}) {
  if (full || !base || /^0+$/.test(base)) return classifyChangedFiles([], { full: true });
  // Invalid/unavailable revisions fail the job; they never silently shrink scope.
  const range = `${base}${mergeBase ? "..." : ".."}${head}`;
  execFileSync("git", ["diff", "--check", range], { stdio: "inherit" });
  const diff = execFileSync("git", ["diff", "--name-only", "-z", range], { encoding: "utf8" });
  return classifyChangedFiles(diff.split("\0"));
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
      `media_inputs_changed=${scope.mediaChanged}\nmedia_desk_changed=${scope.mediaDeskChanged}\ne2e_scope=${scope.scope}\naffected_suites=${scope.suites.join(",")}\ngroups=${scope.groups.join(",")}\nchanged_count=${scope.changedFiles.length}\n`,
    );
  }
}
