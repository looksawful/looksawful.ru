import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import {
  access,
  readdir,
  readFile,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { cases } from "../src/data/catalog/cases.ts";
import { clients } from "../src/data/catalog/clients.ts";
import { collections } from "../src/data/catalog/collections.ts";
import { engagements } from "../src/data/catalog/engagements.ts";
import { projects } from "../src/data/catalog/projects/index.ts";
import { roles } from "../src/data/taxonomy/roles.ts";
import { mediaAssets } from "../src/data/media/assets/index.ts";
import { mediaEntries } from "../src/data/media/entries/index.ts";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "m4v"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "ogg"]);
const MEDIA_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
]);

const EXTENSION_FORMATS = new Map([
  ["jpg", "jpeg"],
  ["jpeg", "jpeg"],
  ["png", "png"],
  ["webp", "webp"],
  ["gif", "gif"],
  ["svg", "svg"],
  ["mp4", "mp4"],
  ["m4v", "mp4"],
  ["mov", "mov"],
  ["webm", "webm"],
  ["mp3", "mp3"],
  ["wav", "wav"],
  ["m4a", "mp4"],
  ["aac", "aac"],
  ["ogg", "ogg"],
]);

const CODE_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".ts",
]);

function normalizePublicSrc(src: string): string {
  return String(src).split(/[?#]/, 1)[0].replace(/\\/g, "/").replace(/^\.?\//, "");
}

function extensionFor(src: string): string {
  return path.extname(normalizePublicSrc(src)).slice(1).toLowerCase();
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function statCaseSensitive(filePath: string): Promise<{ exists: boolean; path: string; size?: number }> {
  const absolute = path.resolve(filePath);
  const root = path.parse(absolute).root;
  const segments = path.relative(root, absolute).split(path.sep).filter(Boolean);
  let current = root;

  for (const segment of segments) {
    let entries;

    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return { exists: false, path: absolute };
    }

    const exact = entries.find((entry) => entry.name === segment);

    if (!exact) {
      return { exists: false, path: absolute };
    }

    current = path.join(current, exact.name);
  }

  try {
    const fileStat = await stat(current);
    return { exists: fileStat.isFile(), path: current, size: fileStat.size };
  } catch {
    return { exists: false, path: absolute };
  }
}

async function resolveMediaFile(repoRoot: string, src: string): Promise<{ path: string; size: number } | null> {
  const clean = normalizePublicSrc(src);
  const candidates = [
    path.join(repoRoot, clean),
    path.join(repoRoot, "public", clean),
  ];

  for (const candidate of candidates) {
    const result = await statCaseSensitive(candidate);
    if (result.exists && typeof result.size === "number") {
      return { path: result.path, size: result.size };
    }
  }

  return null;
}

async function hashFile(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

export async function inspectFileFormat(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const head = buffer.subarray(0, 512);

  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
  if (head.length >= 8 && head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (head.subarray(0, 6).toString("ascii") === "GIF87a" || head.subarray(0, 6).toString("ascii") === "GIF89a") return "gif";
  if (head.length >= 12 && head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (head.length >= 4 && head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return "webm";
  if (head.subarray(0, 3).toString("ascii") === "ID3" || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) return "mp3";
  if (head.length >= 12 && head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WAVE") return "wav";
  if (head.length >= 12 && head.subarray(4, 8).toString("ascii") === "ftyp") {
    const brands = head.toString("ascii", 8, Math.min(head.length, 64));
    if (brands.includes("qt  ")) return "mov";
    return "mp4";
  }

  const text = head.toString("utf8").trimStart().toLowerCase();
  if (text.startsWith("<svg") || text.startsWith("<?xml") && text.includes("<svg")) return "svg";
  if (text.startsWith("oggs")) return "ogg";

  return "unknown";
}

async function rasterDimensions(filePath: string): Promise<{ width?: number; height?: number; format?: string }> {
  try {
    const metadata = await sharp(filePath, { animated: false }).metadata();
    return { width: metadata.width, height: metadata.height, format: metadata.format };
  } catch {
    return {};
  }
}

function pushDuplicateErrors(
  errors: string[],
  entityName: string,
  items: readonly { id: string }[],
): void {
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`${entityName}: duplicate id "${item.id}"`);
    }
    seen.add(item.id);
  }
}

function pushDuplicateSrcErrors(errors: string[], assets: readonly { id: string; src: string }[]): void {
  const bySrc = new Map<string, string>();

  for (const asset of assets) {
    const key = normalizePublicSrc(asset.src).toLowerCase();
    const previous = bySrc.get(key);

    if (previous) {
      errors.push(`MediaAsset(${asset.id}).src: duplicate public src "${asset.src}" already used by "${previous}"`);
      continue;
    }

    bySrc.set(key, asset.id);
  }
}

function assertUniqueValues(
  errors: string[],
  owner: string,
  field: string,
  values?: readonly string[],
): void {
  if (!values) return;
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${owner}.${field}: duplicate reference "${value}"`);
    }
    seen.add(value);
  }
}

function assertReferences(
  errors: string[],
  owner: string,
  field: string,
  values: readonly string[] | undefined,
  validIds: ReadonlySet<string>,
): void {
  if (!values) return;

  for (const value of values) {
    if (!validIds.has(value)) {
      errors.push(`${owner}.${field}: unknown id "${value}"`);
    }
  }
}

function assertPrimaryRole(
  errors: string[],
  owner: string,
  primaryRoleId: string | undefined,
  roleIds: readonly string[] | undefined,
  roleIdSet: ReadonlySet<string>,
): void {
  if (!primaryRoleId) return;

  if (!roleIdSet.has(primaryRoleId)) {
    errors.push(`${owner}.primaryRoleId: unknown role "${primaryRoleId}"`);
  }

  if (roleIds && !roleIds.includes(primaryRoleId)) {
    errors.push(`${owner}: primaryRoleId "${primaryRoleId}" is missing from roleIds`);
  }
}

async function walkFiles(root: string): Promise<string[]> {
  if (!(await exists(root))) return [];
  const output: string[] = [];
  const stack = [root];

  while (stack.length) {
    const dir = stack.pop()!;
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        output.push(fullPath);
      }
    }
  }

  return output;
}

async function collectDirectReferences(repoRoot: string): Promise<Set<string>> {
  const refs = new Set<string>();
  const roots = ["index.html", "src", "tools", "test"]
    .map((entry) => path.join(repoRoot, entry));
  const files: string[] = [];

  for (const root of roots) {
    try {
      const rootStat = await stat(root);
      if (rootStat.isDirectory()) files.push(...await walkFiles(root));
      else files.push(root);
    } catch {}
  }

  const mediaPattern = /(["'(`])((?:\.?\/)?(?:media|pets)\/[^"'()`\s<>]+|\/(?:media|pets)\/[^"'()`\s<>]+)\1/g;

  for (const file of files) {
    if (!CODE_EXTENSIONS.has(path.extname(file).toLowerCase())) continue;
    const text = await readFile(file, "utf8");

    for (const match of text.matchAll(mediaPattern)) {
      const clean = normalizePublicSrc(match[2]);
      if (MEDIA_EXTENSIONS.has(extensionFor(clean))) {
        refs.add(clean);
      }
    }
  }

  return refs;
}

async function inspectGeneratedManifest(
  errors: string[],
  repoRoot: string,
  manifestPath: string,
): Promise<{ variantCount: number; bytes: number }> {
  if (!(await exists(manifestPath))) return { variantCount: 0, bytes: 0 };
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  let variantCount = 0;
  let bytes = 0;

  for (const asset of manifest.assets ?? []) {
    for (const variant of asset.variants ?? []) {
      variantCount += 1;
      const resolved = await resolveMediaFile(repoRoot, variant.src);

      if (!resolved) {
        errors.push(`stale generated variant: ${variant.src} for ${asset.id ?? asset.src} does not exist`);
        continue;
      }

      bytes += resolved.size;

      if (typeof variant.bytes === "number" && variant.bytes !== resolved.size) {
        errors.push(`stale generated variant: ${variant.src} bytes ${variant.bytes} != ${resolved.size}`);
      }
    }
  }

  return { variantCount, bytes };
}

type IntegrityOptions = {
  repoRoot?: string;
  mediaAssets?: readonly any[];
  mediaEntries?: readonly any[];
  generatedManifestPath?: string;
  scanPhysicalMedia?: boolean;
};

export async function createMediaIntegrityReport(options: IntegrityOptions = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const assets = options.mediaAssets ?? mediaAssets;
  const entries = options.mediaEntries ?? mediaEntries;
  const errors: string[] = [];
  const warnings: string[] = [];
  const assetIds = new Set(assets.map((asset) => asset.id));
  const srcToAssetId = new Map<string, string>();
  const usedAssetIds = new Set<string>();
  const hashes = new Map<string, { id: string; path: string }[]>();
  let sourceBytes = 0;
  let imageCount = 0;
  let videoCount = 0;
  let audioCount = 0;

  pushDuplicateErrors(errors, "MediaAsset", assets);
  pushDuplicateErrors(errors, "MediaEntry", entries);
  pushDuplicateSrcErrors(errors, assets);

  for (const asset of assets) {
    const owner = `MediaAsset(${asset.id})`;
    const cleanSrc = normalizePublicSrc(asset.src);
    const ext = extensionFor(asset.src);
    const expectedFormat = EXTENSION_FORMATS.get(ext);
    srcToAssetId.set(cleanSrc, asset.id);

    if (asset.type === "image") imageCount += 1;
    else if (asset.type === "video") videoCount += 1;
    else if (AUDIO_EXTENSIONS.has(ext)) audioCount += 1;

    const resolved = await resolveMediaFile(repoRoot, asset.src);

    if (!resolved) {
      errors.push(`${owner}: delivery file does not exist: ${asset.src}`);
      continue;
    }

    if (asset.type === "video" && asset.sourceSrc) {
      const sourceMaster = await resolveMediaFile(repoRoot, asset.sourceSrc);
      if (!sourceMaster) {
        errors.push(`${owner}.sourceSrc: source master does not exist: ${asset.sourceSrc}`);
      } else {
        const sourceExt = extensionFor(asset.sourceSrc);
        const expectedSourceFormat = EXTENSION_FORMATS.get(sourceExt);
        const actualSourceFormat = await inspectFileFormat(sourceMaster.path);
        if (expectedSourceFormat && actualSourceFormat !== expectedSourceFormat) {
          errors.push(`${owner}.sourceSrc: extension ${sourceExt} does not match actual ${actualSourceFormat}: ${asset.sourceSrc}`);
        }
      }
    }

    sourceBytes += resolved.size;

    const actualFormat = await inspectFileFormat(resolved.path);

    if (expectedFormat && actualFormat !== expectedFormat) {
      errors.push(`${owner}: extension ${ext} does not match actual ${actualFormat}: ${asset.src}`);
    }

    if (asset.type === "image" && IMAGE_EXTENSIONS.has(ext) && actualFormat !== "svg") {
      const dimensions = await rasterDimensions(resolved.path);

      if (typeof asset.width === "number" && typeof dimensions.width === "number" && asset.width !== dimensions.width) {
        errors.push(`${owner}: width ${asset.width} != ${dimensions.width}: ${asset.src}`);
      }

      if (typeof asset.height === "number" && typeof dimensions.height === "number" && asset.height !== dimensions.height) {
        errors.push(`${owner}: height ${asset.height} != ${dimensions.height}: ${asset.src}`);
      }
    }

    const fileHash = await hashFile(resolved.path);
    const group = hashes.get(fileHash) ?? [];
    group.push({ id: asset.id, path: resolved.path });
    hashes.set(fileHash, group);
  }

  for (const entry of entries) {
    const owner = `MediaEntry(${entry.id})`;
    usedAssetIds.add(entry.assetId);

    if (!assetIds.has(entry.assetId)) {
      errors.push(`${owner}.assetId: unknown MediaAsset "${entry.assetId}"`);
    }

    if (entry.posterAssetId) {
      usedAssetIds.add(entry.posterAssetId);

      if (!assetIds.has(entry.posterAssetId)) {
        errors.push(`${owner}.posterAssetId: unknown MediaAsset "${entry.posterAssetId}"`);
      }
    }
  }

  const registryUnusedAssets = assets
    .filter((asset) => !usedAssetIds.has(asset.id))
    .map((asset) => asset.id);

  for (const [hash, group] of hashes) {
    if (group.length > 1) {
      warnings.push(`byte-identical files ${hash.slice(0, 12)}: ${group.map((item) => item.id).join(", ")}`);
    }
  }

  const generatedManifestPath = options.generatedManifestPath
    ?? path.join(repoRoot, "public", "media", "generated", "responsive-manifest.json");
  const generated = await inspectGeneratedManifest(errors, repoRoot, generatedManifestPath);

  let physicalMediaCount = 0;
  let potentiallyUnusedPhysical: string[] = [];

  if (options.scanPhysicalMedia !== false) {
    const physicalFiles = [
      ...await walkFiles(path.join(repoRoot, "media")),
      ...await walkFiles(path.join(repoRoot, "public", "media")),
      ...await walkFiles(path.join(repoRoot, "public", "pets")),
    ].filter((file) => MEDIA_EXTENSIONS.has(extensionFor(file)));
    const directRefs = await collectDirectReferences(repoRoot);

    physicalMediaCount = physicalFiles.length;
    potentiallyUnusedPhysical = physicalFiles
      .map((file) => {
        const relativePublic = normalizePublicSrc(path.relative(path.join(repoRoot, "public"), file));
        const relativeRoot = normalizePublicSrc(path.relative(repoRoot, file));
        if (srcToAssetId.has(relativePublic) || srcToAssetId.has(relativeRoot)) return null;
        if (directRefs.has(relativePublic) || directRefs.has(relativeRoot)) return null;
        if (relativePublic.startsWith("media/generated/")) return null;
        return relativePublic.startsWith("..") ? relativeRoot : relativePublic;
      })
      .filter(Boolean)
      .slice(0, 200) as string[];
  }

  pushDuplicateErrors(errors, "Client", clients);
  pushDuplicateErrors(errors, "Case", cases);
  pushDuplicateErrors(errors, "Collection", collections);
  pushDuplicateErrors(errors, "Engagement", engagements);
  pushDuplicateErrors(errors, "Project", projects);
  pushDuplicateErrors(errors, "Role", roles);

  const clientIds = new Set(clients.map(({ id }) => id));
  const caseIds = new Set(cases.map(({ id }) => id));
  const collectionIds = new Set(collections.map(({ id }) => id));
  const engagementIds = new Set(engagements.map(({ id }) => id));
  const projectIds = new Set(projects.map(({ id }) => id));
  const roleIds = new Set(roles.map(({ id }) => id));

  for (const item of cases) {
    const owner = `Case(${item.id})`;
    assertUniqueValues(errors, owner, "clientIds", item.clientIds);
    assertUniqueValues(errors, owner, "engagementIds", item.engagementIds);
    assertUniqueValues(errors, owner, "roleIds", item.roleIds);
    assertReferences(errors, owner, "clientIds", item.clientIds, clientIds);
    assertReferences(errors, owner, "engagementIds", item.engagementIds, engagementIds);
    assertReferences(errors, owner, "roleIds", item.roleIds, roleIds);
    assertPrimaryRole(errors, owner, item.primaryRoleId, item.roleIds, roleIds);
  }

  for (const item of collections) {
    const owner = `Collection(${item.id})`;
    assertUniqueValues(errors, owner, "roleIds", item.roleIds);
    assertReferences(errors, owner, "roleIds", item.roleIds, roleIds);
    assertPrimaryRole(errors, owner, item.primaryRoleId, item.roleIds, roleIds);
  }

  for (const item of engagements) {
    const owner = `Engagement(${item.id})`;
    assertUniqueValues(errors, owner, "clientIds", item.clientIds);
    assertUniqueValues(errors, owner, "roleIds", item.roleIds);
    assertReferences(errors, owner, "clientIds", item.clientIds, clientIds);
    assertReferences(errors, owner, "roleIds", item.roleIds, roleIds);
    assertPrimaryRole(errors, owner, item.primaryRoleId, item.roleIds, roleIds);
  }

  for (const item of projects) {
    const owner = `Project(${item.id})`;
    assertUniqueValues(errors, owner, "caseIds", item.caseIds);
    assertUniqueValues(errors, owner, "clientIds", item.clientIds);
    assertUniqueValues(errors, owner, "collectionIds", item.collectionIds);
    assertUniqueValues(errors, owner, "engagementIds", item.engagementIds);
    assertUniqueValues(errors, owner, "roleIds", item.roleIds);
    assertReferences(errors, owner, "caseIds", item.caseIds, caseIds);
    assertReferences(errors, owner, "clientIds", item.clientIds, clientIds);
    assertReferences(errors, owner, "collectionIds", item.collectionIds, collectionIds);
    assertReferences(errors, owner, "engagementIds", item.engagementIds, engagementIds);
    assertReferences(errors, owner, "roleIds", item.roleIds, roleIds);
    assertPrimaryRole(errors, owner, item.primaryRoleId, item.roleIds, roleIds);
  }

  return {
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
    summary: {
      assets: assets.length,
      entries: entries.length,
      images: imageCount,
      videos: videoCount,
      audio: audioCount,
      sourceBytes,
      generatedVariants: generated.variantCount,
      generatedBytes: generated.bytes,
      registryUnusedAssets,
      physicalMediaCount,
      potentiallyUnusedPhysical,
    },
  };
}

async function runCli(): Promise<void> {
  const report = await createMediaIntegrityReport();

  if (report.errors.length) {
    console.error("Data integrity check failed:\n");
    for (const error of report.errors) console.error(`- ${error}`);
  }

  if (report.warnings.length) {
    console.warn("\nMedia integrity warnings:\n");
    for (const warning of report.warnings.slice(0, 40)) console.warn(`- ${warning}`);
    if (report.warnings.length > 40) console.warn(`- ... ${report.warnings.length - 40} more warnings`);
  }

  if (report.summary.registryUnusedAssets.length) {
    console.warn(`\nPotentially unused registry assets: ${report.summary.registryUnusedAssets.length}`);
  }

  if (report.summary.potentiallyUnusedPhysical.length) {
    console.warn(`Potentially unused physical media: ${report.summary.potentiallyUnusedPhysical.length} shown of first 200`);
  }

  if (report.errors.length) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `Data integrity OK: ${clients.length} clients, ${cases.length} cases, ${engagements.length} engagements, ${projects.length} projects, ${mediaEntries.length} media entries, ${report.summary.assets} media assets (${report.summary.images} images, ${report.summary.videos} videos), ${report.summary.sourceBytes} source bytes.`,
  );
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  await runCli();
}
