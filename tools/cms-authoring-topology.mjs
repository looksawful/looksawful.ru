import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { classifyCmsPublicationFiles } from "./cms-publication-scope.mjs";

function runGit(repoRoot, args) {
  return execFileSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function currentBranch(repoRoot) {
  try {
    return runGit(repoRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  } catch {
    return null;
  }
}

function parseAheadBehind(value) {
  const [behindText = "0", aheadText = "0"] = String(value).trim().split(/\s+/);
  const behind = Number.parseInt(behindText, 10);
  const ahead = Number.parseInt(aheadText, 10);
  return {
    ahead: Number.isFinite(ahead) ? ahead : 0,
    behind: Number.isFinite(behind) ? behind : 0,
  };
}

export function inspectCmsAuthoringTopology({
  repoRoot = process.cwd(),
  devRef = "origin/dev",
  authoringBranch = "content/text-cms",
  ready = false,
  files = [],
  ci = process.env.CI === "true" || process.env.CI === "1",
} = {}) {
  const root = path.resolve(repoRoot);
  const branch = currentBranch(root);
  const headSha = runGit(root, ["rev-parse", "HEAD"]);
  const devSha = runGit(root, ["rev-parse", devRef]);
  const worktree = runGit(root, ["rev-parse", "--show-toplevel"]);
  const dirty = runGit(root, ["status", "--porcelain=v1"]).length > 0;
  const { ahead, behind } = parseAheadBehind(
    runGit(root, ["rev-list", "--left-right", "--count", `${devRef}...HEAD`]),
  );
  const diverged = ahead > 0 && behind > 0;
  const scope = classifyCmsPublicationFiles(files);
  const authoringAllowed = branch === authoringBranch && !ci;

  let integrationReason = "ready-and-cms-only";
  if (!authoringAllowed) integrationReason = "authoring-checkout-required";
  else if (dirty) integrationReason = "dirty-checkout";
  else if (!ready) integrationReason = "ready-required";
  else if (diverged) integrationReason = "reconciliation-required";
  else if (scope.files.length === 0) integrationReason = "empty-diff";
  else if (!scope.safe) integrationReason = "scope-blocked";

  return {
    authoringBranch,
    authoringAllowed,
    branch,
    worktree,
    headSha,
    devRef,
    devSha,
    dirty,
    ahead,
    behind,
    diverged,
    intendedIntegrationTarget: "dev",
    ready: Boolean(ready),
    scope,
    integrationAllowed: integrationReason === "ready-and-cms-only",
    integrationReason,
  };
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseFilesJson(value) {
  if (!value) return [];
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error("--files-json must be a JSON array of repository paths");
  }
  return parsed;
}

if (process.argv[1] && fileURLToPath(new URL(import.meta.url)) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const result = inspectCmsAuthoringTopology({
    repoRoot: argumentValue(args, "--repo") ?? process.cwd(),
    devRef: argumentValue(args, "--dev") ?? "origin/dev",
    authoringBranch: argumentValue(args, "--authoring-branch") ?? "content/text-cms",
    ready: args.includes("--ready"),
    files: parseFilesJson(argumentValue(args, "--files-json")),
  });
  console.log(JSON.stringify(result, null, 2));
}
