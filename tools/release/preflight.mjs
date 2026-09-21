import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`invalid argument sequence near ${key ?? "<end>"}`);
    }
    const name = key.slice(2);
    const values = args.get(name) ?? [];
    values.push(value);
    args.set(name, values);
  }
  return args;
}

function required(args, name) {
  const value = args.get(name)?.at(-1);
  if (!value) throw new Error(`missing --${name}`);
  return value;
}
function git(repo, ...args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
}

function changedEntries(repo, base, head) {
  const output = git(repo, "diff", "--name-status", "-M", "--diff-filter=ACMR", `${base}..${head}`);
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean).map((line) => {
    const [status, ...paths] = line.split("\t");
    const target = status.startsWith("R") ? paths.at(-1) : paths[0];
    return { status, paths, target };
  });
}

function changedFiles(repo, base, head) {
  return changedEntries(repo, base, head).map((entry) => entry.target);
}

function mergeTree(repo, left, right) {
  const result = spawnSync(
    "git",
    ["-c", "core.quotePath=false", "merge-tree", "--write-tree", left, right],
    { cwd: repo, encoding: "utf8" },
  );
  if (result.error) throw result.error;

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  const tree = lines[0]?.trim();
  if (!tree || !/^[0-9a-f]{40,64}$/.test(tree)) {
    throw new Error(stderr.trim() || stdout.trim() || "git merge-tree did not return a tree");
  }
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(stderr.trim() || stdout.trim() || `git merge-tree failed with status ${result.status}`);
  }

  const conflicts = new Set();
  for (const line of lines.slice(1)) {
    const stageEntry = line.match(/^\d{6} [0-9a-f]+ [123]\t(.+)$/);
    if (stageEntry) conflicts.add(stageEntry[1]);
  }
  if (result.status === 1 && conflicts.size === 0) {
    throw new Error(stderr.trim() || stdout.trim() || "git merge-tree reported an unclassified conflict");
  }

  return { tree, conflicts };
}

function differingFiles(repo, left, right, files) {
  if (!files.length) return [];
  const output = git(repo, "diff", "--name-only", left, right, "--", ...files);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

export function isLabOnlyPath(file) {
  const normalized = file.replaceAll("\\", "/");
  return normalized === "lab/index.html"
    || normalized.startsWith("src/lab/")
    || normalized.startsWith("tools/lab/")
    || normalized.startsWith("public/lab/")
    || normalized === ".github/workflows/lab-preview.yml"
    || normalized === "docs/LAB.md"
    || normalized.startsWith(".agents/skills/looksawful-design-lab/");
}

export function runPreflight(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const repo = path.resolve(required(args, "repo"));
  const prodBase = required(args, "prod-base");
  const candidate = required(args, "candidate");
  const approvedBase = required(args, "approved-base");
  const approvedHead = required(args, "approved-head");

  const candidateEntries = changedEntries(repo, prodBase, candidate);
  const candidateFiles = candidateEntries.map((entry) => entry.target);
  const labOnly = [...new Set(candidateEntries.flatMap((entry) => entry.paths).filter(isLabOnlyPath))];
  if (labOnly.length) {
    for (const file of labOnly) console.error(`LAB_ONLY_PATH ${file}`);
    return 1;
  }

  const approvedProductFiles = changedFiles(repo, approvedBase, approvedHead)
    .filter((file) => !isLabOnlyPath(file));
  const candidateSet = new Set(candidateFiles);
  const missing = approvedProductFiles.filter((file) => !candidateSet.has(file));
  if (missing.length) {
    for (const file of missing) console.error(`MISSING_APPROVED_FILE ${file}`);
    return 1;
  }
  const allowlist = new Set([...approvedProductFiles, ...(args.get("allow") ?? [])]);
  const unapproved = candidateFiles.filter((file) => !allowlist.has(file));
  if (unapproved.length) {
    for (const file of unapproved) console.error(`UNAPPROVED_CANDIDATE_FILE ${file}`);
    return 1;
  }

  const prodFiles = changedFiles(repo, approvedBase, prodBase);
  const prodFileSet = new Set(prodFiles);
  const overlap = approvedProductFiles.filter((file) => prodFileSet.has(file));
  if (overlap.length) {
    let expected;
    try {
      expected = mergeTree(repo, prodBase, approvedHead);
    } catch {
      for (const file of overlap) console.error(`PROD_OVERLAP_REQUIRES_RECONCILIATION ${file}`);
      return 1;
    }

    const overlapConflicts = overlap.filter((file) => expected.conflicts.has(file));
    if (overlapConflicts.length) {
      for (const file of overlapConflicts) console.error(`PROD_OVERLAP_REQUIRES_RECONCILIATION ${file}`);
      return 1;
    }

    const dropped = differingFiles(repo, candidate, expected.tree, overlap);
    if (dropped.length) {
      for (const file of dropped) console.error(`PROD_ONLY_CHANGE_DROPPED ${file}`);
      return 1;
    }
  }

  console.log("RELEASE_PREFLIGHT_OK");
  return 0;
}
const isMain = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    process.exitCode = runPreflight();
  } catch (error) {
    console.error(`PREFLIGHT_ERROR ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
