import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const planPath = process.argv[2];

if (!planPath) {
  throw new Error("Usage: node scripts/cleanup-gallery-safe.mjs <duplicate-plan.json>");
}

const skipDirs = new Set([
  ".git",
  ".vite",
  "dist",
  "node_modules",
  "_reports",
  "docs",
]);
const textExtensions = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".yml",
  ".yaml",
]);

const knownUnusedPlaceholders = [
  "public/assets/media/cases/jesteipool/03-form/placeholders/collage-video-placeholder-01.mp4",
  "public/assets/media/cases/jesteipool/03-form/placeholders/collage-video-placeholder-01.mp4",
  "public/assets/media/pets/awful-describer.png",
];

function toPublicPath(repoPath) {
  return `/${repoPath.replace(/^public\//, "")}`;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) continue;
    if (entry.isFile() && entry.name === "audits.txt") continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
const replacements = new Map();
const filesToDelete = new Set();

for (const group of plan) {
  if (group.scope === "cross-project") continue;
  const canonical = group.canonical;
  if (!canonical || !(await exists(path.join(rootDir, canonical)))) continue;

  for (const redundant of group.redundant || []) {
    if (!redundant || redundant === canonical) continue;
    const absolute = path.join(rootDir, redundant);
    if (!(await exists(absolute))) continue;
    replacements.set(redundant, canonical);
    replacements.set(toPublicPath(redundant), toPublicPath(canonical));
    filesToDelete.add(redundant);
  }
}

const textFiles = await walk(rootDir);
let changedTextFiles = 0;
let replacementCount = 0;

for (const filePath of textFiles) {
  let source;
  try {
    source = await fs.readFile(filePath, "utf8");
  } catch {
    continue;
  }

  let updated = source;
  for (const [from, to] of replacements) {
    if (!updated.includes(from)) continue;
    const parts = updated.split(from);
    replacementCount += parts.length - 1;
    updated = parts.join(to);
  }

  if (updated !== source) {
    await fs.writeFile(filePath, updated, "utf8");
    changedTextFiles += 1;
  }
}

let deletedDuplicates = 0;
let reclaimedBytes = 0;
for (const repoPath of filesToDelete) {
  const absolute = path.join(rootDir, repoPath);
  if (!(await exists(absolute))) continue;
  const stat = await fs.stat(absolute);
  await fs.unlink(absolute);
  reclaimedBytes += stat.size;
  deletedDuplicates += 1;
}

let deletedPlaceholders = 0;
for (const repoPath of knownUnusedPlaceholders) {
  const absolute = path.join(rootDir, repoPath);
  if (!(await exists(absolute))) continue;
  const stat = await fs.stat(absolute);
  await fs.unlink(absolute);
  reclaimedBytes += stat.size;
  deletedPlaceholders += 1;
}

console.log(JSON.stringify({
  duplicateGroups: plan.length,
  deletedDuplicates,
  deletedPlaceholders,
  changedTextFiles,
  replacementCount,
  reclaimedBytes,
  reclaimedMegabytes: Number((reclaimedBytes / 1024 / 1024).toFixed(3)),
}, null, 2));
