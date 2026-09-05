import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mediaAssets } from "../../src/data/media/assets/index.ts";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mov", ".mp4", ".m4v", ".webm"]);

const FULL_REBUILD_FILES = new Set([
  "package-lock.json",
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "tools/media-dev-state.mjs",
  "tools/sync-media-catalog.mjs",
  "src/data/media/responsive-policy.ts",
  "src/data/media/catalog.ts",
  "src/data/media/catalog-records.generated.ts",
]);

const FULL_REBUILD_PREFIXES = [
  "src/data/media/assets/",
  "src/content/media-catalog/registered/",
  "src/content/media-catalog/uploads/",
];

function normalizePath(value) {
  return String(value).trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function sourceRepoPath(asset) {
  const source = String(asset.sourceSrc ?? asset.src ?? "")
    .split(/[?#]/, 1)[0]
    .replaceAll("\\", "/")
    .replace(/^\.?\//, "");
  return source ? `public/${source}` : "";
}

function isFullRebuildPath(file) {
  return FULL_REBUILD_FILES.has(file)
    || FULL_REBUILD_PREFIXES.some((prefix) => file.startsWith(prefix));
}

function isMediaSourcePath(file) {
  const extension = path.posix.extname(file).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
}

export function resolveAffectedMediaPaths(changedPaths, assets = mediaAssets) {
  const files = [...new Set(changedPaths.map(normalizePath).filter(Boolean))].sort();
  const bySourcePath = new Map();

  for (const asset of assets) {
    const sourcePath = sourceRepoPath(asset);
    if (!sourcePath) continue;
    const existing = bySourcePath.get(sourcePath) ?? [];
    existing.push(asset);
    bySourcePath.set(sourcePath, existing);
  }

  const imageAssetIds = new Set();
  const videoAssetIds = new Set();
  const unmatchedMediaPaths = new Set();
  const fullRebuildPaths = new Set();

  for (const file of files) {
    if (isFullRebuildPath(file)) {
      fullRebuildPaths.add(file);
      continue;
    }

    const matches = bySourcePath.get(file) ?? [];
    if (matches.length) {
      for (const asset of matches) {
        if (asset.type === "image") imageAssetIds.add(asset.id);
        else if (asset.type === "video") videoAssetIds.add(asset.id);
      }
      continue;
    }

    if (isMediaSourcePath(file)) unmatchedMediaPaths.add(file);
  }

  return Object.freeze({
    changedPaths: files,
    imageAssetIds: [...imageAssetIds].sort(),
    videoAssetIds: [...videoAssetIds].sort(),
    unmatchedMediaPaths: [...unmatchedMediaPaths].sort(),
    fullRebuildPaths: [...fullRebuildPaths].sort(),
    requiresFullRebuild: fullRebuildPaths.size > 0,
  });
}

function readChangedPaths(base, head) {
  if (!base || !head) throw new Error("affected-media requires both --base and --head");
  const output = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMR", base, head, "--"],
    { encoding: "utf8" },
  );
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function parseCli(argv) {
  const options = { base: null, head: null, githubOutput: null, paths: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--base") options.base = argv[++index] ?? null;
    else if (argument === "--head") options.head = argv[++index] ?? null;
    else if (argument === "--github-output") options.githubOutput = argv[++index] ?? null;
    else if (argument === "--path") options.paths.push(argv[++index] ?? "");
    else throw new Error(`unknown affected-media argument: ${argument}`);
  }
  return options;
}

function writeGithubOutputs(filePath, result) {
  const imageOnly = result.imageAssetIds.length > 0
    && result.videoAssetIds.length === 0
    && result.unmatchedMediaPaths.length === 0
    && !result.requiresFullRebuild;
  const lines = [
    `image_asset_ids=${result.imageAssetIds.join(",")}`,
    `video_asset_ids=${result.videoAssetIds.join(",")}`,
    `image_asset_count=${result.imageAssetIds.length}`,
    `video_asset_count=${result.videoAssetIds.length}`,
    `unmatched_media_count=${result.unmatchedMediaPaths.length}`,
    `requires_full_rebuild=${result.requiresFullRebuild}`,
    `image_only=${imageOnly}`,
  ];
  appendFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

async function runCli() {
  const options = parseCli(process.argv.slice(2));
  const changedPaths = options.paths.length
    ? options.paths
    : readChangedPaths(options.base, options.head);
  const result = resolveAffectedMediaPaths(changedPaths);

  if (options.githubOutput) writeGithubOutputs(options.githubOutput, result);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  await runCli();
}
