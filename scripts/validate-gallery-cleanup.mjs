import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const manifestPath = path.join(publicDir, "assets", "gallery", "manifest.json");
const planPath = process.argv[2];

if (!planPath) {
  throw new Error("Usage: node scripts/validate-gallery-cleanup.mjs <duplicate-plan.json>");
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const removedPlaceholders = new Set([
  "public/assets/media/cases/jesteipool/03-form/placeholders/collage-video-placeholder-01.mp4",
  "public/assets/media/cases/jesteipool/03-form/placeholders/collage-video-placeholder-01.mp4",
  "public/assets/media/pets/awful-describer.png",
]);

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
const items = Array.isArray(manifest.items) ? manifest.items : [];
const errors = [];
const ids = new Set();
const srcs = new Set();
let videos = 0;

for (const item of items) {
  if (!item?.id || ids.has(item.id)) errors.push(`duplicate or missing id: ${item?.id || "<empty>"}`);
  ids.add(item.id);

  if (!item?.src || srcs.has(item.src)) errors.push(`duplicate or missing src: ${item?.src || "<empty>"}`);
  srcs.add(item.src);

  if (item?.src?.includes("/assets/gallery/database/vanila-draft/00-site/") || item?.src?.includes("/assets/gallery/database/vanila-draft/01-resume/")) {
    errors.push(`service asset remains in manifest: ${item.src}`);
  }

  const absolute = path.join(publicDir, String(item?.src || "").replace(/^\//, ""));
  if (!(await exists(absolute))) errors.push(`manifest file missing: ${item?.src}`);
  if (item?.type === "video") videos += 1;
}

for (const group of plan) {
  if (group.scope === "cross-project") continue;
  if (removedPlaceholders.has(group.canonical)) continue;
  const canonical = path.join(rootDir, group.canonical);
  if (!(await exists(canonical))) errors.push(`canonical file missing: ${group.canonical}`);
  for (const redundant of group.redundant || []) {
    if (removedPlaceholders.has(redundant)) continue;
    if (await exists(path.join(rootDir, redundant))) errors.push(`redundant file still exists: ${redundant}`);
  }
}

for (const repoPath of removedPlaceholders) {
  if (await exists(path.join(rootDir, repoPath))) errors.push(`unused placeholder still exists: ${repoPath}`);
}

if (videos < 1) errors.push("manifest contains no videos after video indexing fix");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  items: items.length,
  uniqueIds: ids.size,
  uniqueSrcs: srcs.size,
  videos,
  checkedDuplicateGroups: plan.filter((group) => group.scope !== "cross-project" && !removedPlaceholders.has(group.canonical)).length,
  status: "ok",
}, null, 2));
