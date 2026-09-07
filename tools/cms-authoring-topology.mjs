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

export function isCmsAuthoringBranch(branch) {
  if (typeof branch !== "string" || !branch.startsWith("content/")) return false;
  const segments = branch.split("/").slice(1);
  if (segments.length === 0) return false;
  return segments.every(
    (segment) =>
      segment !== "." &&
      segment !== ".." &&
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment),
  );
}

export function inspectCmsAuthoringTopology({
  repoRoot = process.cwd(),
  devRef = "origin/dev",
} = {}) {
  const root = path.resolve(repoRoot);
  const branch = currentBranch(root);
  const headSha = runGit(root, ["rev-parse", "HEAD"]);
  const devSha = runGit(root, ["rev-parse", devRef]);
  const baseSha = runGit(root, ["merge-base", "HEAD", devRef]);
  const dirty = runGit(root, ["status", "--porcelain=v1"]).length > 0;
  const changedFilesRaw = runGit(root, [
    "diff",
    "--name-only",
    "--diff-filter=ACDMRTUXB",
    `${devRef}...HEAD`,
  ]);
  const changedFiles = changedFilesRaw ? changedFilesRaw.split(/\r?\n/).filter(Boolean) : [];
  const scope = classifyCmsPublicationFiles(changedFiles);
  const allowedAuthoringBranch = isCmsAuthoringBranch(branch);
  const stale = baseSha !== devSha;
  const reasons = [];

  if (!allowedAuthoringBranch) reasons.push("not-content-authoring-branch");
  if (stale) reasons.push("stale-base");
  if (dirty) reasons.push("dirty-worktree");
  if (!scope.safe) reasons.push("blocked-scope");

  return {
    branch,
    headSha,
    baseSha,
    devRef,
    devSha,
    integrationTarget: "dev",
    allowedAuthoringBranch,
    stale,
    dirty,
    changedFiles,
    scope,
    integrationReady: reasons.length === 0,
    reasons,
  };
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  try {
    const result = inspectCmsAuthoringTopology({
      repoRoot: argumentValue(args, "--repo") ?? process.cwd(),
      devRef: argumentValue(args, "--dev") ?? "origin/dev",
    });
    console.log(JSON.stringify(result, null, 2));
    if (args.includes("--require-integration-ready") && !result.integrationReady) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
