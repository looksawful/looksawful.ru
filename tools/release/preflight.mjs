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
function gitRaw(repo, ...args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" });
}

function git(repo, ...args) {
  return gitRaw(repo, ...args).trim();
}

function changedEntries(repo, base, head) {
  const output = gitRaw(
    repo,
    "-c",
    "core.quotePath=false",
    "diff",
    "--name-status",
    "-z",
    "-M",
    "--diff-filter=ACMR",
    `${base}..${head}`,
  );
  if (!output) return [];

  const fields = output.split("\0");
  if (fields.at(-1) === "") fields.pop();

  const entries = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    const pathCount = /^[RC]/.test(status) ? 2 : 1;
    const paths = fields.slice(index, index + pathCount);
    index += pathCount;
    const target = paths.at(-1);
    if (!target || paths.length !== pathCount) {
      throw new Error("git diff returned an incomplete name-status record");
    }
    entries.push({ status, paths, target });
  }
  return entries;
}

function changedFiles(repo, base, head) {
  return changedEntries(repo, base, head).map((entry) => entry.target);
}

function mergeTree(repo, left, right, mergeBase) {
  const result = spawnSync(
    "git",
    ["-c", "core.quotePath=false", "merge-tree", "--write-tree", `--merge-base=${mergeBase}`, left, right],
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
  const output = gitRaw(
    repo,
    "-c",
    "core.quotePath=false",
    "diff",
    "--name-only",
    "-z",
    left,
    right,
    "--",
    ...files,
  );
  return output ? output.split("\0").filter(Boolean) : [];
}

function readTreeText(repo, treeish, file) {
  const entry = gitRaw(
    repo,
    "-c",
    "core.quotePath=false",
    "ls-tree",
    "-z",
    treeish,
    "--",
    file,
  );
  if (!entry) throw new Error(`missing tree entry for ${file}`);

  const tab = entry.indexOf("\t");
  const metadata = tab >= 0 ? entry.slice(0, tab).split(" ") : [];
  const type = metadata[1];
  const object = metadata[2];
  if (type !== "blob" || !object) {
    throw new Error(`expected blob tree entry for ${file}`);
  }

  return gitRaw(repo, "cat-file", "-p", object);
}

function stableMergedSegments(text) {
  const lines = text.match(/.*(?:\n|$)/g)?.filter(Boolean) ?? [];
  const segments = [];
  let current = "";
  let inConflict = false;
  let sawConflict = false;

  for (const line of lines) {
    if (!inConflict && line.startsWith("<<<<<<< ")) {
      sawConflict = true;
      if (current) segments.push(current);
      current = "";
      inConflict = true;
      continue;
    }
    if (inConflict) {
      if (line.startsWith(">>>>>>> ")) inConflict = false;
      continue;
    }
    current += line;
  }

  if (inConflict) throw new Error("unterminated merge conflict marker");
  if (current) segments.push(current);
  return { sawConflict, segments };
}

function preservesReconciledStableContent(repo, expectedTree, candidate, file) {
  const expectedText = readTreeText(repo, expectedTree, file);
  const candidateText = readTreeText(repo, candidate, file);
  const { sawConflict, segments } = stableMergedSegments(expectedText);
  if (!sawConflict) return false;

  let cursor = 0;
  for (const segment of segments) {
    const match = candidateText.indexOf(segment, cursor);
    if (match < 0) return false;
    cursor = match + segment.length;
  }
  return true;
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
  const reconcilePaths = new Set(args.get("reconcile") ?? []);
  const invalidReconcileOutsideOverlap = [...reconcilePaths].filter((file) => !overlap.includes(file));
  if (invalidReconcileOutsideOverlap.length) {
    for (const file of invalidReconcileOutsideOverlap) console.error(`INVALID_RECONCILIATION_PATH ${file}`);
    return 1;
  }

  if (overlap.length) {
    let expected;
    try {
      expected = mergeTree(repo, prodBase, approvedHead, approvedBase);
    } catch {
      for (const file of overlap) console.error(`PROD_OVERLAP_REQUIRES_RECONCILIATION ${file}`);
      return 1;
    }

    const overlapConflicts = overlap.filter((file) => expected.conflicts.has(file));
    const invalidReconcileNonConflicts = [...reconcilePaths].filter((file) => !overlapConflicts.includes(file));
    if (invalidReconcileNonConflicts.length) {
      for (const file of invalidReconcileNonConflicts) console.error(`INVALID_RECONCILIATION_PATH ${file}`);
      return 1;
    }

    const unresolvedConflicts = overlapConflicts.filter((file) => !reconcilePaths.has(file));
    if (unresolvedConflicts.length) {
      for (const file of unresolvedConflicts) console.error(`PROD_OVERLAP_REQUIRES_RECONCILIATION ${file}`);
      return 1;
    }

    const autoReconciled = overlap.filter((file) => !reconcilePaths.has(file));
    const dropped = differingFiles(repo, candidate, expected.tree, autoReconciled);
    const reconciledDropped = [...reconcilePaths].filter(
      (file) => !preservesReconciledStableContent(repo, expected.tree, candidate, file),
    );
    const allDropped = [...new Set([...dropped, ...reconciledDropped])];
    if (allDropped.length) {
      for (const file of allDropped) console.error(`PROD_ONLY_CHANGE_DROPPED ${file}`);
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
