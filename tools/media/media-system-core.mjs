import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  IMAGE_EXTENSIONS,
  IMAGE_RECIPE,
  MEDIA_PATHS,
  MEDIA_PIPELINE_VERSION,
  MEDIA_PROJECTS,
  VIDEO_EXTENSIONS,
} from "./media.config.mjs";

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

const ASSET_NAME = /^(?<position>\d{2})-(?<ratio>\d+x\d+)(?<extension>\.[a-z0-9]+)$/i;
const MEDIA_ID = /^(?<project>[a-z0-9-]+)-(?<container>\d{2})-(?<position>\d{2})$/;

function gcd(first, second) {
  let left = Math.abs(Math.round(first));
  let right = Math.abs(Math.round(second));

  while (right) {
    [left, right] = [right, left % right];
  }

  return left || 1;
}

export function ratioToken(width, height, tolerance = IMAGE_RECIPE.ratioTolerance) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new TypeError(`Invalid dimensions: ${width}x${height}`);
  }

  const ratio = width / height;
  let best = null;

  for (const [token, standard] of STANDARD_RATIOS) {
    const error = Math.abs(ratio - standard) / standard;

    if (!best || error < best.error) {
      best = { token, error };
    }
  }

  if (best && best.error <= tolerance) {
    return best.token;
  }

  const divisor = gcd(width, height);
  return `${Math.round(width / divisor)}x${Math.round(height / divisor)}`;
}

export function ratioValue(token) {
  const match = /^(?<width>\d+)x(?<height>\d+)$/.exec(String(token ?? ""));

  if (!match) return null;

  const width = Number(match.groups.width);
  const height = Number(match.groups.height);

  if (width <= 0 || height <= 0) return null;
  return width / height;
}

export function parseMediaId(value) {
  const match = MEDIA_ID.exec(String(value ?? ""));

  if (!match) {
    throw new Error(`Invalid media id: ${value}`);
  }

  const { project, container, position } = match.groups;

  if (!MEDIA_PROJECTS.includes(project)) {
    throw new Error(`Unknown media project in id: ${value}`);
  }

  return { project, container, position };
}

export function parseAssetName(filename) {
  const match = ASSET_NAME.exec(String(filename ?? ""));

  if (!match) {
    throw new Error(
      `Invalid media filename "${filename}". Expected <position>-<ratio>.<format>.`,
    );
  }

  const extension = match.groups.extension.toLowerCase();
  const image = IMAGE_EXTENSIONS.includes(extension);
  const video = VIDEO_EXTENSIONS.includes(extension);

  if (!image && !video) {
    throw new Error(`Unsupported canonical media extension: ${extension}`);
  }

  return {
    position: match.groups.position,
    ratio: match.groups.ratio,
    extension,
    type: image ? "image" : "video",
    stem: path.basename(filename, extension),
  };
}

export function parseCanonicalRelative(relativePath) {
  const normalized = String(relativePath).replaceAll("\\", "/");
  const parts = normalized.split("/").filter(Boolean);

  if (parts.length !== 3) {
    throw new Error(
      `Invalid canonical media path "${relativePath}". Expected <project>/<container>/<file>.`,
    );
  }

  const [project, container, filename] = parts;

  if (!MEDIA_PROJECTS.includes(project)) {
    throw new Error(`Unknown media project: ${project}`);
  }

  if (!/^\d{2}$/.test(container)) {
    throw new Error(`Invalid media container: ${container}`);
  }

  const asset = parseAssetName(filename);

  return {
    project,
    container,
    filename,
    ...asset,
    id: `${project}-${container}-${asset.position}`,
    relativePath: normalized,
  };
}

export function normalizeHtmlPath(value) {
  return String(value ?? "")
    .replaceAll("&amp;", "&")
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
}

export function parseTagAttributes(tag) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  const open = /^<[^\s>]+/.exec(tag)?.[0] ?? "";
  const source = tag.slice(open.length, tag.lastIndexOf(">"));
  let match;

  while ((match = pattern.exec(source))) {
    const name = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attributes.set(name, value);
  }

  return attributes;
}

export function setTagAttribute(tag, name, value = "") {
  const escaped = String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");
  const attributePattern = new RegExp(
    `\\s${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`,
    "i",
  );

  if (attributePattern.test(tag)) {
    return tag.replace(
      attributePattern,
      value === "" ? ` ${name}` : ` ${name}="${escaped}"`,
    );
  }

  const closing = tag.endsWith("/>") ? "/>" : ">";
  return tag.slice(0, -closing.length) +
    (value === "" ? ` ${name}` : ` ${name}="${escaped}"`) +
    closing;
}

export function removeTagAttribute(tag, name) {
  const attributePattern = new RegExp(
    `\\s${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`,
    "i",
  );
  return tag.replace(attributePattern, "");
}

export function addClassName(tag, className) {
  const attributes = parseTagAttributes(tag);
  const classes = new Set(
    String(attributes.get("class") ?? "")
      .split(/\s+/)
      .filter(Boolean),
  );

  classes.add(className);
  return setTagAttribute(tag, "class", [...classes].join(" "));
}

export function extractManagedMediaTags(html) {
  const records = [];
  const pattern = /<(img|video)\b[^>]*\bdata-media-id\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi;
  let match;

  while ((match = pattern.exec(html))) {
    const tag = match[0];
    const attributes = parseTagAttributes(tag);
    const id = match[2] ?? match[3];

    records.push({
      id,
      type: match[1].toLowerCase(),
      src: attributes.get("src") ?? "",
      tag,
      index: match.index,
    });
  }

  return records;
}

export function sourcePathFromHtml({ projectRoot, src }) {
  const normalized = normalizeHtmlPath(src);

  if (/^[a-z]:\//i.test(normalized)) {
    return path.resolve(normalized);
  }

  if (normalized.startsWith("media/")) {
    return path.resolve(projectRoot, "public", normalized);
  }

  return path.resolve(projectRoot, normalized);
}

export async function collectCanonicalAssets(projectRoot) {
  const root = path.resolve(projectRoot, MEDIA_PATHS.sources);
  const assets = [];

  async function walk(directory, relative = "") {
    let entries;

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }

    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));

    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const nextRelative = relative
        ? `${relative}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        await walk(absolute, nextRelative);
        continue;
      }

      if (!entry.isFile()) continue;

      const descriptor = parseCanonicalRelative(nextRelative);
      const info = await stat(absolute);

      assets.push({
        ...descriptor,
        absolute,
        size: info.size,
        mtimeMs: Math.trunc(info.mtimeMs),
      });
    }
  }

  await walk(root);
  assets.sort((left, right) =>
    left.relativePath.localeCompare(right.relativePath, "en"),
  );

  const ids = new Set();

  for (const asset of assets) {
    if (ids.has(asset.id)) {
      throw new Error(`Duplicate canonical media id: ${asset.id}`);
    }

    ids.add(asset.id);
  }

  return assets;
}

export async function sha256File(filename) {
  const hash = createHash("sha256");

  await new Promise((resolve, reject) => {
    const stream = createReadStream(filename);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });

  return hash.digest("hex");
}

export function shortHash(value, length = 8) {
  return String(value).slice(0, length);
}

export function recipeHash() {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: MEDIA_PIPELINE_VERSION,
        recipe: IMAGE_RECIPE,
      }),
    )
    .digest("hex");
}

export function selectImageWidths(sourceWidth) {
  if (!Number.isFinite(sourceWidth) || sourceWidth <= 0) {
    throw new TypeError(`Invalid source width: ${sourceWidth}`);
  }

  const maxWidth = Math.round(sourceWidth);
  const widths = IMAGE_RECIPE.widths.filter((width) => width <= maxWidth);

  if (!widths.includes(maxWidth) && maxWidth < IMAGE_RECIPE.widths.at(-1)) {
    widths.push(maxWidth);
  }

  if (widths.length === 0) {
    widths.push(maxWidth);
  }

  return [...new Set(widths)].sort((left, right) => left - right);
}

export function closestVariant(variants, target, preference = "nearest") {
  if (!variants.length) return null;

  if (preference === "at-least") {
    return variants.find((variant) => variant.width >= target) ?? variants.at(-1);
  }

  return variants.reduce((best, variant) => {
    if (!best) return variant;

    const bestDistance = Math.abs(best.width - target);
    const distance = Math.abs(variant.width - target);
    return distance < bestDistance ? variant : best;
  }, null);
}

export function generatedAssetDirectory(projectRoot, asset) {
  return path.resolve(
    projectRoot,
    MEDIA_PATHS.generated,
    asset.project,
    asset.container,
  );
}

export function generatedVariantFilename(asset, width, sourceHash) {
  return `${asset.stem}--w${String(width).padStart(4, "0")}-${shortHash(sourceHash)}.webp`;
}

export function generatedStableFilename(asset) {
  return asset.type === "image"
    ? `${asset.stem}.webp`
    : `${asset.stem}${asset.extension}`;
}

export function generatedUrl(asset, filename) {
  return `./media/generated/projects/${asset.project}/${asset.container}/${filename}`;
}

export function mediaOrientation(width, height) {
  if (!width || !height) return "unknown";
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

export function ensureInside(parent, candidate) {
  const parentPath = path.resolve(parent);
  const candidatePath = path.resolve(candidate);
  const relative = path.relative(parentPath, candidatePath);

  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Unsafe path outside managed root: ${candidatePath}`);
  }

  return candidatePath;
}

export function duplicateGroups(entries) {
  const byHash = new Map();

  for (const entry of entries) {
    if (!entry.sourceHash) continue;
    const group = byHash.get(entry.sourceHash) ?? [];
    group.push(entry);
    byHash.set(entry.sourceHash, group);
  }

  return [...byHash.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([hash, group]) => ({
      hash,
      ids: group.map((entry) => entry.id).sort(),
      sources: group.map((entry) => entry.source).sort(),
    }))
    .sort((left, right) => left.hash.localeCompare(right.hash));
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
