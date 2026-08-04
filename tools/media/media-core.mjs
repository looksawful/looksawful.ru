import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const STANDARD_RATIOS = Object.freeze([
  ["1x1", 1],
  ["4x5", 4 / 5],
  ["3x4", 3 / 4],
  ["2x3", 2 / 3],
  ["9x16", 9 / 16],
  ["4x3", 4 / 3],
  ["3x2", 3 / 2],
  ["16x10", 16 / 10],
  ["16x9", 16 / 9],
  ["21x9", 21 / 9],
]);

const IMAGE_EXTENSIONS = new Set([
  ".avif", ".gif", ".heic", ".heif", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp",
]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".m4v", ".mov", ".webm"]);

export function normalizeSource(value) {
  return String(value ?? "")
    .replaceAll("&amp;", "&")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
}

function gcd(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

export function ratioToken(width, height, tolerance = 0.025) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new TypeError(`Invalid dimensions: ${width}x${height}`);
  }

  const ratio = width / height;
  let best = null;

  for (const [token, standard] of STANDARD_RATIOS) {
    const error = Math.abs(ratio - standard) / standard;
    if (!best || error < best.error) best = { token, error };
  }

  if (best && best.error <= tolerance) return best.token;

  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}x${Math.round(height / divisor)}`;
}

function candidateProjectPaths(projectRoot, source) {
  const normalized = normalizeSource(source);
  return [
    path.resolve(projectRoot, normalized),
    path.resolve(projectRoot, "public", normalized),
  ];
}

function resolveExtensionless(candidate) {
  if (path.extname(candidate)) return null;
  const directory = path.dirname(candidate);
  const stem = path.basename(candidate).toLocaleLowerCase("ru");
  if (!existsSync(directory)) return null;

  const matches = readdirSync(directory)
    .filter((name) => {
      const extension = path.extname(name).toLocaleLowerCase("en");
      const nameStem = path.basename(name, extension).toLocaleLowerCase("ru");
      return nameStem === stem && (IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension));
    })
    .sort((a, b) => a.localeCompare(b, "ru"));

  if (matches.length === 1) return path.join(directory, matches[0]);
  return null;
}

export function resolveSourcePath({ projectRoot, source, project, externalRoots = {} }) {
  const attempts = [];

  for (const candidate of candidateProjectPaths(projectRoot, source)) {
    attempts.push(candidate);
    if (existsSync(candidate)) return { path: candidate, attempts };
    const extensionless = resolveExtensionless(candidate);
    if (extensionless) return { path: extensionless, attempts };
  }

  const normalized = normalizeSource(source);
  const externalRoot = externalRoots[project];

  if (externalRoot) {
    let relative = path.basename(normalized);
    if (project === "lyve") {
      const marker = "MEDIA-TEMP/LYVE/Layouts/";
      const markerIndex = normalized.indexOf(marker);
      if (markerIndex >= 0) relative = normalized.slice(markerIndex + marker.length);
    }

    const candidate = path.resolve(externalRoot, relative);
    attempts.push(candidate);
    if (existsSync(candidate)) return { path: candidate, attempts };
    const extensionless = resolveExtensionless(candidate);
    if (extensionless) return { path: extensionless, attempts };
  }

  return { path: null, attempts };
}

export async function inspectImage(filePath) {
  const metadata = await sharp(filePath, { animated: true }).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`No dimensions: ${filePath}`);
  return { width: metadata.width, height: metadata.height };
}

export function inspectVideo(filePath) {
  const result = spawnSync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "json",
      filePath,
    ],
    { encoding: "utf8", windowsHide: true },
  );

  if (result.status !== 0) {
    throw new Error(`ffprobe failed for ${filePath}: ${result.stderr.trim()}`);
  }

  const data = JSON.parse(result.stdout);
  const stream = data.streams?.[0];
  if (!stream?.width || !stream?.height) throw new Error(`No video dimensions: ${filePath}`);
  return { width: Number(stream.width), height: Number(stream.height) };
}

export async function sha256File(filePath) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

export function destinationFor(entry, ratio, extension) {
  const filename = `${entry.position}-${ratio}${extension}`;
  const filesystem = path.join(
    "public", "media", "projects", entry.project, entry.container, "source", filename,
  );
  const url = `./media/projects/${entry.project}/${entry.container}/source/${filename}`;
  return { filename, filesystem, url };
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function replaceAttribute(tag, name, value) {
  const escaped = value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(["'])(.*?)\\2`, "i");
  if (pattern.test(tag)) return tag.replace(pattern, `$1"${escaped}"`);
  const closeIndex = tag.lastIndexOf("/>") >= 0 ? tag.lastIndexOf("/>") : tag.lastIndexOf(">");
  return `${tag.slice(0, closeIndex)} ${name}="${escaped}"${tag.slice(closeIndex)}`;
}

function extractAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? decodeEntities(match[2]) : null;
}

function findProjectSegments(html) {
  const starts = [];
  const regex = /<article\b(?=[^>]*\bclass=(['"])[^'"]*\bcv-item\b[^'"]*\1)[^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) starts.push(match.index);

  return starts.map((start, index) => {
    const end = starts[index + 1] ?? html.length;
    const segment = html.slice(start, end);
    const projectMatch = segment.match(/<span\b(?=[^>]*\bclass=(['"])[^'"]*\bcv-item__project\b[^'"]*\1)[^>]*>([\s\S]*?)<\/span>/i);
    const label = projectMatch
      ? decodeEntities(projectMatch[2].replace(/<[^>]+>/g, "").trim())
      : null;
    return { start, end, label, segment };
  });
}

export function rewriteProjectMedia(html, migratedEntries) {
  const byProject = new Map();
  for (const entry of migratedEntries) {
    if (!byProject.has(entry.projectLabel)) byProject.set(entry.projectLabel, []);
    byProject.get(entry.projectLabel).push(entry);
  }

  const segments = findProjectSegments(html);
  const replacements = [];

  for (const segment of segments) {
    const expected = byProject.get(segment.label);
    if (!expected) continue;

    const tags = [...segment.segment.matchAll(/<(img|video)\b[^>]*\bsrc\s*=\s*(['"])(.*?)\2[^>]*>/gi)];
    if (tags.length !== expected.length) {
      throw new Error(`${segment.label}: expected ${expected.length} media tags, found ${tags.length}`);
    }

    tags.forEach((match, index) => {
      const entry = expected[index];
      const oldSource = decodeEntities(match[3]);
      if (normalizeSource(oldSource) !== normalizeSource(entry.source)) {
        throw new Error(
          `${segment.label} media ${index + 1}: expected ${entry.source}, found ${oldSource}`,
        );
      }

      let nextTag = match[0];
      nextTag = replaceAttribute(nextTag, "src", entry.targetUrl);
      nextTag = replaceAttribute(nextTag, "data-media-id", entry.id);
      nextTag = replaceAttribute(nextTag, "width", String(entry.width));
      nextTag = replaceAttribute(nextTag, "height", String(entry.height));

      replacements.push({
        start: segment.start + match.index,
        end: segment.start + match.index + match[0].length,
        value: nextTag,
      });
    });
  }

  let output = html;
  replacements.sort((a, b) => b.start - a.start);
  for (const replacement of replacements) {
    output = output.slice(0, replacement.start) + replacement.value + output.slice(replacement.end);
  }
  return output;
}

export function groupDuplicateHashes(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.sourceHash)) groups.set(entry.sourceHash, []);
    groups.get(entry.sourceHash).push(entry);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([hash, group]) => ({ hash, ids: group.map((entry) => entry.id), sources: group.map((entry) => entry.source) }));
}

export function mediaExtension(filePath, type) {
  if (type === "image") return ".webp";
  const extension = path.extname(filePath).toLocaleLowerCase("en");
  if (!VIDEO_EXTENSIONS.has(extension)) throw new Error(`Unsupported video extension: ${filePath}`);
  return extension;
}
