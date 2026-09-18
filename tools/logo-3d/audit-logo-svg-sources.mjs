import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VECTOR_TAG_RE = /<(?:path|circle|ellipse|rect|polygon|polyline|line)\b/gi;
const IMAGE_TAG_RE = /<image\b/gi;

export function classifySvgMarkup(markup) {
  const vectorElements = markup.match(VECTOR_TAG_RE)?.length ?? 0;
  const imageElements = markup.match(IMAGE_TAG_RE)?.length ?? 0;

  let kind = "no-geometry";
  if (vectorElements > 0 && imageElements === 0) kind = "vector-svg";
  if (vectorElements === 0 && imageElements > 0) kind = "raster-wrapper";
  if (vectorElements > 0 && imageElements > 0) kind = "mixed-svg";

  return { kind, vectorElements, imageElements };
}

async function walkSvgFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const item of entries) {
    const absolute = path.join(root, item.name);
    if (item.isDirectory()) files.push(...(await walkSvgFiles(absolute)));
    if (item.isFile() && item.name.toLowerCase().endsWith(".svg")) files.push(absolute);
  }
  return files;
}export async function auditLogoSvgSources(repoRoot) {
  const logoRoot = path.join(repoRoot, "public", "media", "projects");
  const files = await walkSvgFiles(logoRoot);
  files.push(path.join(repoRoot, "public", "favicon.svg"));

  const report = [];
  for (const absolute of files.sort()) {
    const markup = await readFile(absolute, "utf8");
    report.push({
      path: path.relative(repoRoot, absolute).replaceAll("\\", "/"),
      ...classifySvgMarkup(markup),
    });
  }
  return report;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const report = await auditLogoSvgSources(repoRoot);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}