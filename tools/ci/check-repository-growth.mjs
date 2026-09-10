import { execFileSync } from "node:child_process";
import { lstatSync } from "node:fs";
import path from "node:path";

const MEBIBYTE = 1024 * 1024;
const IMAGE_MAX_BYTES = 50 * MEBIBYTE;
const VIDEO_MAX_BYTES = 95 * MEBIBYTE;
const GENERIC_MAX_BYTES = 95 * MEBIBYTE;

const forbiddenRoots = [
  "media/",
  "public/assets/media/cases/",
  "public/media/generated/responsive/",
  "public/media/generated/video/",
];

const forbiddenSourceExtensions = new Set([
  ".psd",
  ".psb",
  ".blend",
  ".blend1",
  ".aep",
  ".aepx",
  ".tif",
  ".tiff",
  ".exr",
  ".dng",
  ".cr2",
  ".nef",
  ".arw",
  ".7z",
  ".zip",
  ".rar",
]);

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const videoExtensions = new Set([".mov", ".mp4", ".m4v", ".webm"]);

function formatMiB(bytes) {
  return `${(bytes / MEBIBYTE).toFixed(1)} MiB`;
}

function sizeLimitFor(extension) {
  if (imageExtensions.has(extension)) return IMAGE_MAX_BYTES;
  if (videoExtensions.has(extension)) return VIDEO_MAX_BYTES;
  return GENERIC_MAX_BYTES;
}

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "buffer" })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const violations = [];
let checkedFiles = 0;
let largest = { file: "", bytes: 0 };

for (const file of tracked) {
  const normalized = file.replaceAll("\\", "/");
  const lower = normalized.toLowerCase();

  if (forbiddenRoots.some((root) => lower.startsWith(root))) {
    violations.push(`${normalized}: tracked path belongs outside the canonical repository tree`);
    continue;
  }

  const extension = path.extname(lower);
  if (forbiddenSourceExtensions.has(extension)) {
    violations.push(`${normalized}: heavyweight source/archive format must stay outside Git`);
    continue;
  }

  let stat;
  try {
    stat = lstatSync(file);
  } catch {
    violations.push(`${normalized}: tracked file is missing from the checkout`);
    continue;
  }
  if (!stat.isFile()) continue;

  checkedFiles += 1;
  if (stat.size > largest.bytes) largest = { file: normalized, bytes: stat.size };

  const limit = sizeLimitFor(extension);
  if (stat.size > limit) {
    violations.push(
      `${normalized}: ${formatMiB(stat.size)} exceeds the tracked-file limit ${formatMiB(limit)}`,
    );
  }
}

if (violations.length) {
  console.error("[repo-growth] blocked repository growth:");
  for (const violation of violations.sort()) console.error(`- ${violation}`);
  process.exit(1);
}

const largestSummary = largest.file ? `; largest tracked file: ${largest.file} (${formatMiB(largest.bytes)})` : "";
console.log(`[repo-growth] checked ${checkedFiles} tracked files${largestSummary}`);
