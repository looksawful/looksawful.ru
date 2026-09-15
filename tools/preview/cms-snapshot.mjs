import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { classifyCmsPublicationFiles } from "../cms-publication-scope.mjs";
import { planCmsPreview } from "./source-contract.mjs";

const EXACT_SHA = /^[0-9a-f]{40}$/;

function arg(args, name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

function git(cwd, args, options = {}) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: options.stdio ?? ["ignore", "pipe", "pipe"] }).trim();
}

function readRemoteRefSha(cwd, ref) {
  try {
    const output = git(cwd, ["ls-remote", "--exit-code", "origin", ref]);
    const sha = output.split(/\s+/, 1)[0];
    if (!EXACT_SHA.test(sha)) throw new Error(`remote ref ${ref} returned an invalid exact SHA`);
    return sha;
  } catch (error) {
    if (error && typeof error === "object" && error.status === 2) return null;
    throw error;
  }
}

export function cmsPreviewLeaseArgument(ref, expectedSha) {
  if (!String(ref).startsWith("refs/heads/cms-preview/")) {
    throw new Error("CMS preview lease ref is outside the disposable namespace");
  }
  if (expectedSha !== null && !EXACT_SHA.test(String(expectedSha))) {
    throw new Error("CMS preview lease expected value must be an exact SHA or null");
  }
  return `--force-with-lease=${ref}:${expectedSha ?? ""}`;
}

export function validateCmsSnapshot({ id, baseBranch = "dev", allowLabBase = false, files }) {
  const scope = classifyCmsPublicationFiles(files);
  if (!scope.safe || scope.files.length === 0) {
    throw new Error(`CMS preview blocked: ${scope.blocked.map((item) => item.path).join(", ") || "no files"}`);
  }
  const plan = planCmsPreview({
    id,
    baseBranch,
    allowLabBase,
    changedPaths: scope.files.map((item) => item.path),
    authorizedPrefixes: ["src/content/", "public/media/", "src/data/media/"],
  });
  return { plan, scope };
}

export function createCmsSnapshot({ repoRoot, id, baseBranch = "dev", allowLabBase = false, files, push = false }) {
  const { plan, scope } = validateCmsSnapshot({ id, baseBranch, allowLabBase, files });
  if (!push) return { ...plan, files: scope.files, dryRun: true };

  git(repoRoot, ["fetch", "origin", baseBranch], { stdio: "ignore" });
  const remoteRef = `refs/heads/${plan.ref}`;
  const expectedRemoteSha = readRemoteRefSha(repoRoot, remoteRef);
  const worktree = mkdtempSync(path.join(tmpdir(), "looksawful-cms-preview-"));
  try {
    git(repoRoot, ["worktree", "add", "--detach", worktree, `origin/${baseBranch}`], { stdio: "ignore" });
    for (const { path: relative } of scope.files) {
      const source = path.join(repoRoot, relative);
      const target = path.join(worktree, relative);
      if (existsSync(source)) {
        mkdirSync(path.dirname(target), { recursive: true });
        cpSync(source, target, { recursive: true });
      } else if (existsSync(target)) {
        rmSync(target, { recursive: true, force: true });
      }
    }
    git(worktree, ["add", "--", ...scope.files.map((item) => item.path)]);
    const actual = git(worktree, ["diff", "--cached", "--name-only"]).split(/\r?\n/).filter(Boolean).sort();
    const verified = classifyCmsPublicationFiles(actual);
    if (!verified.safe || actual.length === 0) throw new Error("CMS preview snapshot produced no safe changes");
    git(worktree, ["-c", "user.name=looksawful CMS Preview", "-c", "user.email=preview@looksawful.local", "commit", "-m", `preview(cms): ${id}`], { stdio: "ignore" });
    const sha = git(worktree, ["rev-parse", "HEAD"]);
    git(worktree, ["push", cmsPreviewLeaseArgument(remoteRef, expectedRemoteSha), "origin", `HEAD:${remoteRef}`], { stdio: "ignore" });
    return { ...plan, sha, files: verified.files, dryRun: false };
  } finally {
    try { git(repoRoot, ["worktree", "remove", "--force", worktree], { stdio: "ignore" }); } catch {}
    rmSync(worktree, { recursive: true, force: true });
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  const args = process.argv.slice(2);
  const filesPath = arg(args, "--files");
  const id = arg(args, "--id");
  if (!filesPath || !id) throw new Error("Usage: node tools/preview/cms-snapshot.mjs --id <id> --files <json> [--base dev|lab] [--allow-lab] [--push]");
  const files = JSON.parse(readFileSync(filesPath, "utf8"));
  const result = createCmsSnapshot({
    repoRoot: process.cwd(),
    id,
    baseBranch: arg(args, "--base") ?? "dev",
    allowLabBase: args.includes("--allow-lab"),
    files,
    push: args.includes("--push"),
  });
  console.log(JSON.stringify(result, null, 2));
}
