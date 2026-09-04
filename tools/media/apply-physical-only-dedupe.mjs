import { readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registeredMediaAssets } from "../../src/data/media/assets/registered.ts";
import noMergeSource from "../media-migration/manifests/2026-09-03-media-dedupe/no-merge.json" with { type: "json" };
import physicalSource from "../media-migration/manifests/2026-09-03-media-dedupe/physical-only.json" with { type: "json" };

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const APPLY = process.argv.includes("--apply");
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".css",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
]);

function absolute(repoPath) {
  return path.resolve(ROOT, repoPath);
}

function repoPath(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

function publicUrlForPhysicalPath(repoPathValue) {
  if (!repoPathValue.startsWith("public/")) return null;
  return repoPathValue.slice("public".length);
}

function physicalPathForAsset(asset) {
  if (typeof asset?.src !== "string" || !asset.src.startsWith("/")) return null;
  return `public${asset.src.split(/[?#]/, 1)[0]}`;
}

function classifyReference(filePath) {
  const value = repoPath(filePath);
  if (value.startsWith("tools/media-migration/manifests/")) return "MIGRATION_EVIDENCE";
  if (value.startsWith("public/media/generated/") || value.includes("catalog-records.generated")) {
    return "GENERATED";
  }
  if (value.includes("tmp-media-dedupe") || value.startsWith(".cache/")) return "TEMP_TOOL";
  if (value.startsWith("test/")) return "TEST_FIXTURE";
  return "RUNTIME_DIRECT";
}

async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", ".cache"].includes(entry.name)) continue;
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(next));
    else result.push(next);
  }
  return result;
}

async function exactReferences(values) {
  const wanted = new Set(values.filter(Boolean));
  const result = [];
  if (wanted.size === 0) return result;

  for (const filePath of await walk(ROOT)) {
    if (!TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase())) continue;
    let text;
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      continue;
    }
    for (const value of wanted) {
      if (!text.includes(value)) continue;
      result.push({
        path: repoPath(filePath),
        kind: classifyReference(filePath),
        value,
      });
    }
  }
  return result;
}

export function validatePhysicalOnlyManifest(
  source,
  { registeredPaths = new Set(), noMergePaths = new Set(), deferredProtectedPaths = new Set() } = {},
) {
  const blockers = [];
  const paths = source.removePhysicalPaths ?? [];
  const uniquePaths = new Set(paths);

  if (paths.length !== source.removedPhysicalPathCount) {
    blockers.push(
      `physical-only path count mismatch: manifest=${source.removedPhysicalPathCount} actual=${paths.length}`,
    );
  }
  if (uniquePaths.size !== paths.length) {
    blockers.push(`physical-only deletion set contains ${paths.length - uniquePaths.size} duplicate path(s)`);
  }

  for (const repoPathValue of uniquePaths) {
    if (!repoPathValue.startsWith("public/")) {
      blockers.push(`physical-only path is outside public/: ${repoPathValue}`);
    }
    if (registeredPaths.has(repoPathValue)) {
      blockers.push(`physical-only path is still a registered canonical source: ${repoPathValue}`);
    }
    if (noMergePaths.has(repoPathValue)) {
      blockers.push(`physical-only path is protected by a no-merge decision: ${repoPathValue}`);
    }
    if (deferredProtectedPaths.has(repoPathValue)) {
      blockers.push(`physical-only path overlaps a deferred rewrite/promotion source: ${repoPathValue}`);
    }
  }

  return [...new Set(blockers)];
}

async function buildPlan() {
  const registeredPaths = new Set(
    registeredMediaAssets.map(physicalPathForAsset).filter(Boolean),
  );
  const noMergePaths = new Set(
    noMergeSource.flatMap((constraint) => [constraint.left, constraint.right]),
  );
  const registeredById = new Map(registeredMediaAssets.map((asset) => [asset.id, asset]));
  const deferredProtectedPaths = new Set();

  for (const item of physicalSource.deferredRuntimeRewrites ?? []) {
    deferredProtectedPaths.add(item.path);
    deferredProtectedPaths.add(item.canonicalPath);
  }
  for (const item of physicalSource.deferredQualityPromotions ?? []) {
    deferredProtectedPaths.add(item.bestSourcePath);
    const canonicalAsset = registeredById.get(item.canonicalAssetId);
    const canonicalPath = physicalPathForAsset(canonicalAsset);
    if (canonicalPath) deferredProtectedPaths.add(canonicalPath);
  }

  const blockers = validatePhysicalOnlyManifest(physicalSource, {
    registeredPaths,
    noMergePaths,
    deferredProtectedPaths,
  });
  const paths = [...new Set(physicalSource.removePhysicalPaths ?? [])];
  const files = [];
  let actualBytes = 0;

  for (const repoPathValue of paths) {
    try {
      const info = await stat(absolute(repoPathValue));
      if (!info.isFile()) {
        blockers.push(`physical-only target is not a file: ${repoPathValue}`);
        files.push({ path: repoPathValue, exists: true, byteLength: null });
        continue;
      }
      actualBytes += info.size;
      files.push({ path: repoPathValue, exists: true, byteLength: info.size });
    } catch {
      blockers.push(`missing physical-only target: ${repoPathValue}`);
      files.push({ path: repoPathValue, exists: false, byteLength: null });
    }
  }

  if (files.every((file) => file.exists) && actualBytes !== physicalSource.removedBytes) {
    blockers.push(
      `physical-only byte total mismatch: manifest=${physicalSource.removedBytes} actual=${actualBytes}`,
    );
  }

  const referenceValues = paths.flatMap((repoPathValue) => [
    repoPathValue,
    publicUrlForPhysicalPath(repoPathValue),
  ]);
  const refs = await exactReferences(referenceValues);
  const ignoredReferenceValues = new Set(
    (physicalSource.ignoredTemporaryToolReferences ?? []).flatMap((repoPathValue) => [
      repoPathValue,
      publicUrlForPhysicalPath(repoPathValue),
    ]),
  );
  const blockingRefs = refs.filter((ref) => {
    if (ref.kind !== "RUNTIME_DIRECT") return false;
    if (!ignoredReferenceValues.has(ref.value)) return true;
    return !ref.path.includes("tmp-media-dedupe") && !ref.path.startsWith("tools/media-migration/");
  });

  for (const ref of blockingRefs) {
    blockers.push(`live reference blocks physical-only deletion: ${ref.path} -> ${ref.value}`);
  }

  return {
    blockers: [...new Set(blockers)],
    files,
    refs,
    blockingRefs,
    actualBytes,
  };
}

async function applyPlan(plan) {
  let removedBytes = 0;
  const removedPaths = [];

  for (const file of plan.files) {
    const info = await stat(absolute(file.path));
    await rm(absolute(file.path));
    removedBytes += info.size;
    removedPaths.push(file.path);
  }

  if (removedPaths.length !== physicalSource.removedPhysicalPathCount) {
    throw new Error(
      `physical-only apply count mismatch: expected ${physicalSource.removedPhysicalPathCount}, removed ${removedPaths.length}`,
    );
  }
  if (removedBytes !== physicalSource.removedBytes) {
    throw new Error(
      `physical-only apply byte mismatch: expected ${physicalSource.removedBytes}, removed ${removedBytes}`,
    );
  }

  return { removedPathCount: removedPaths.length, removedBytes, removedPaths };
}

async function main() {
  const plan = await buildPlan();
  const summary = {
    mode: APPLY ? "apply" : "dry-run",
    scheduledPathCount: physicalSource.removedPhysicalPathCount,
    expectedBytes: physicalSource.removedBytes,
    existingPathCount: plan.files.filter((file) => file.exists).length,
    actualBytes: plan.actualBytes,
    blockingReferenceCount: plan.blockingRefs.length,
    blockers: plan.blockers,
    clean: plan.blockers.length === 0,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (plan.blockers.length) {
    process.exitCode = 1;
    return;
  }
  if (!APPLY) return;

  const applied = await applyPlan(plan);
  process.stdout.write(`${JSON.stringify({ applied }, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
