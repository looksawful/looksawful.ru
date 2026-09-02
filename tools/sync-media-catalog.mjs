import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { projects } from "../src/data/catalog/projects/index.ts";
import { mediaEntries } from "../src/data/media/entries/index.ts";
import { resolveAssignedProjectIds } from "../src/data/media/project-assignments.ts";
import { registeredMediaAssets } from "../src/data/media/assets/registered.ts";
import {
  MEDIA_CATALOG_DELIVERABLE_IDS,
  MEDIA_CATALOG_PROJECT_TYPE_IDS,
  MEDIA_CATALOG_WORK_AREA_IDS,
} from "../src/data/taxonomy/media-taxonomy.ts";

const REGISTERED_DIR = "src/content/media-catalog/registered";
const UPLOADED_DIR = "src/content/media-catalog/uploads";
const GENERATED_INDEX = "src/data/media/catalog-records.generated.ts";
const MEBIBYTE = 1024 * 1024;

export const CMS_MEDIA_UPLOAD_POLICY = Object.freeze({
  image: Object.freeze({ warnBytes: 20 * MEBIBYTE, maxBytes: 50 * MEBIBYTE }),
  video: Object.freeze({ warnBytes: 50 * MEBIBYTE, maxBytes: 95 * MEBIBYTE }),
});

export function assessCmsMediaUploadSize(mediaType, byteLength) {
  const policy = CMS_MEDIA_UPLOAD_POLICY[mediaType];
  if (!policy) throw new Error(`Unsupported CMS upload media type: ${mediaType}`);
  if (!Number.isFinite(byteLength) || byteLength < 0) {
    throw new Error(`Invalid CMS upload byte length: ${byteLength}`);
  }
  return {
    warning: byteLength > policy.warnBytes,
    allowed: byteLength <= policy.maxBytes,
  };
}

function formatMiB(bytes) {
  return `${(bytes / MEBIBYTE).toFixed(1)} MiB`;
}

function enforceCmsMediaUploadSize(record, byteLength) {
  const assessment = assessCmsMediaUploadSize(record.mediaType, byteLength);
  const policy = CMS_MEDIA_UPLOAD_POLICY[record.mediaType];
  const maxMiB = policy.maxBytes / MEBIBYTE;
  if (!assessment.allowed) {
    throw new Error(
      `CMS media upload exceeds Git-backed ${record.mediaType} limit: ${record.src} (${formatMiB(byteLength)}; max ${maxMiB} MiB). Reduce or compress the source before uploading.`,
    );
  }
  if (assessment.warning) {
    console.warn(
      `[media-catalog] Large CMS ${record.mediaType} upload: ${record.src} (${formatMiB(byteLength)}; max ${maxMiB} MiB)`,
    );
  }
}

const MIME_BY_EXTENSION = new Map([
  ["avif", "image/avif"],
  ["gif", "image/gif"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["svg", "image/svg+xml"],
  ["webp", "image/webp"],
  ["m4v", "video/x-m4v"],
  ["mov", "video/quicktime"],
  ["mp4", "video/mp4"],
  ["webm", "video/webm"],
  ["glb", "model/gltf-binary"],
  ["gltf", "model/gltf+json"],
]);

const WORK_AREA_ORDER = new Map(MEDIA_CATALOG_WORK_AREA_IDS.map((id, index) => [id, index]));
const PROJECT_TYPE_ORDER = new Map(MEDIA_CATALOG_PROJECT_TYPE_IDS.map((id, index) => [id, index]));
const DELIVERABLE_ORDER = new Map(MEDIA_CATALOG_DELIVERABLE_IDS.map((id, index) => [id, index]));
const PROJECT_ORDER = new Map(projects.map(({ id }, index) => [id, index]));
const projectById = new Map(projects.map((project) => [project.id, project]));

function run(command, args, { cwd = process.cwd() } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited ${code}\n${stderr || stdout}`));
    });
  });
}

function cleanSrc(src) {
  return String(src).split(/[?#]/, 1)[0].replace(/\\/g, "/").replace(/^\.?\//, "");
}

function extensionFor(src) {
  return path.extname(cleanSrc(src)).slice(1).toLowerCase();
}

function mimeFor(src, fallback = "") {
  return MIME_BY_EXTENSION.get(extensionFor(src)) ?? fallback;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolvePublicFile(repoRoot, src) {
  const clean = cleanSrc(src);
  const candidates = [path.join(repoRoot, "public", clean)];
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function ordered(values, order) {
  return unique(values).sort((left, right) => {
    const leftOrder = order.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder || left.localeCompare(right);
  });
}

function normalizedCorpus(asset, entries, assignedProjects) {
  return [
    asset.id,
    asset.src,
    ...entries.flatMap((entry) => [
      entry.alt ?? "",
      entry.caption?.title ?? "",
      entry.caption?.text ?? "",
      ...(entry.caption?.meta ?? []),
    ]),
    ...assignedProjects.flatMap((project) => [
      project.name,
      project.summary ?? "",
      project.description ?? "",
    ]),
  ]
    .join(" ")
    .toLocaleLowerCase("ru-RU")
    .replaceAll("ё", "е");
}

function hasAny(text, values) {
  return values.some((value) => text.includes(value));
}

function registeredTechnicalValues(asset) {
  return {
    mediaType: asset.type,
    src: asset.src,
    sourceSrc: asset.type === "video" ? (asset.sourceSrc ?? "") : "",
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    durationSeconds: 0,
    mimeType: asset.type === "model" ? (asset.mimeType ?? mimeFor(asset.src)) : "",
    byteLength: asset.type === "model" ? (asset.byteLength ?? 0) : 0,
  };
}

function inferProjectIds(asset, entries) {
  const direct = entries.flatMap((entry) => entry.projectIds ?? []);
  const inferred = resolveAssignedProjectIds({
    id: `${asset.id}-catalog`,
    assetId: asset.id,
  }) ?? [];
  return ordered([...direct, ...inferred].filter((id) => projectById.has(id)), PROJECT_ORDER);
}

function inferClassification(asset, entries, projectIds) {
  const assignedProjects = projectIds.map((id) => projectById.get(id)).filter(Boolean);
  const corpus = normalizedCorpus(asset, entries, assignedProjects);
  const workAreaIds = assignedProjects.flatMap((project) => project.workAreaIds ?? []);
  const projectTypeIds = assignedProjects.flatMap((project) => project.projectTypeIds ?? []);
  const deliverableIds = assignedProjects.flatMap((project) => project.deliverableIds ?? []);
  const isJestei = asset.id.startsWith("jestei-");
  const isSensetique = asset.id.startsWith("sensetique-");
  const isStyx = asset.id.startsWith("styx-");
  const isShootingFamily =
    asset.src.includes("/shootings/")
    || /^(behance|obladaet|evasha|igguana|esmi|hypression|ofelia|portfolio)-/.test(asset.id);

  if (asset.type === "video") {
    workAreaIds.push("motion");
    projectTypeIds.push("video-project", "motion-project");
  }
  if (asset.type === "model") {
    workAreaIds.push("3d");
    projectTypeIds.push("3d-project");
  }
  if (isSensetique) workAreaIds.push("production", "photography");
  if (isShootingFamily) workAreaIds.push("photography");
  if (isJestei) workAreaIds.push("graphic-design");

  if (
    projectTypeIds.some((id) => [
      "shooting",
      "music-shooting",
      "lookbook",
      "catalog",
      "campaign-shooting",
      "editorial",
      "product-shooting",
      "fashion-shooting",
      "portrait-shooting",
      "cover-shooting",
    ].includes(id))
  ) {
    workAreaIds.push("photography");
    projectTypeIds.push("shooting");
  }

  if (projectTypeIds.includes("scanography-project") || (isStyx && asset.id.startsWith("styx-02-"))) {
    projectTypeIds.push("scanography-project");
    workAreaIds.push("graphic-design");
  }
  if (projectTypeIds.some((id) => ["identity-project", "graphic-design-project", "print-project", "packaging-project", "poster-project", "social-content"].includes(id))) {
    workAreaIds.push("graphic-design");
  }
  if (projectTypeIds.includes("identity-project")) workAreaIds.push("identity");
  if (projectTypeIds.some((id) => ["book-project", "book-design"].includes(id))) {
    workAreaIds.push("editorial-design", "graphic-design");
  }

  if (isShootingFamily && hasAny(corpus, ["obladaet", "evasha", "igguana", "esmi", "hypression", "ofelia", "music", "музык"])) {
    projectTypeIds.push("shooting", "music-shooting");
  }
  if (hasAny(corpus, ["лукбук", "lookbook"])) projectTypeIds.push("shooting", "lookbook");
  if (hasAny(corpus, ["кампейн", "campaign"])) projectTypeIds.push("shooting", "campaign-shooting");
  if (hasAny(corpus, ["эдиториал", "editorial"])) projectTypeIds.push("shooting", "editorial");
  if (hasAny(corpus, ["каталог", "catalog"])) projectTypeIds.push("catalog");
  if (hasAny(corpus, ["иллюстрац"])) workAreaIds.push("illustration");
  if (hasAny(corpus, ["3d", "трехмер", "трёхмер"])) workAreaIds.push("3d");
  if (hasAny(corpus, ["анимац", "motion", "моушен"])) workAreaIds.push("motion");
  if (hasAny(corpus, ["фотограф", "портрет", "съемк", "съёмк"])) workAreaIds.push("photography");
  if (hasAny(corpus, ["продюсер", "продакшен", "production"])) workAreaIds.push("production");

  if (projectTypeIds.includes("identity-project")) deliverableIds.push("identity-system");
  if (projectTypeIds.includes("packaging-project")) deliverableIds.push("packaging");
  if (projectTypeIds.includes("print-project")) deliverableIds.push("print-materials");
  if (projectTypeIds.includes("poster-project")) deliverableIds.push("poster");
  if (projectTypeIds.includes("social-content")) deliverableIds.push("social-media-assets", "social-post");
  if (projectTypeIds.includes("lookbook")) deliverableIds.push("lookbook");
  if (projectTypeIds.includes("catalog")) deliverableIds.push("catalog");
  if (projectTypeIds.includes("campaign-shooting")) deliverableIds.push("campaign-assets");
  if (projectTypeIds.some((id) => ["book-project", "book-design"].includes(id))) deliverableIds.push("book");

  if (hasAny(corpus, ["визитк"])) deliverableIds.push("business-card");
  if (hasAny(corpus, ["баннер"])) deliverableIds.push("banner", "advertising-banner");
  if (hasAny(corpus, ["пост для", "instagram-пост", "социальн"])) deliverableIds.push("social-post");
  if (hasAny(corpus, ["реклам", "promo", "промо"])) deliverableIds.push("advertising-creative");
  if (hasAny(corpus, ["обложк", "cover"])) {
    deliverableIds.push("cover");
    if (projectTypeIds.includes("music-shooting")) deliverableIds.push("music-cover");
  }
  if (hasAny(corpus, ["сертификат"])) deliverableIds.push("certificate");
  if (hasAny(corpus, ["постер", "poster"])) deliverableIds.push("poster");
  if (hasAny(corpus, ["стикер", "sticker"])) deliverableIds.push("sticker");
  if (hasAny(corpus, ["буклет", "booklet"])) deliverableIds.push("booklet");
  if (hasAny(corpus, ["футболк", "t-shirt", "tshirt"])) deliverableIds.push("t-shirt");
  if (hasAny(corpus, ["упаковк", "packaging"])) deliverableIds.push("packaging");
  if (hasAny(corpus, ["брендбук", "brandbook"])) deliverableIds.push("brandbook");
  if (hasAny(corpus, ["логотип", "logo"])) deliverableIds.push("logo");
  if (hasAny(corpus, ["книг", "book design"])) deliverableIds.push("book");

  const screenProject = projectIds.some((id) => id.startsWith("jestei-") && !id.includes("brand-system") && !id.includes("editorial-policy"));
  if (
    screenProject
    || hasAny(corpus, ["интерфейс", "лендинг", "страниц", "виджет", "экран", "ui kit", "ui-kit"])
  ) {
    deliverableIds.push("screen-mockup");
  }

  const allowedWorkAreas = workAreaIds.filter((id) => WORK_AREA_ORDER.has(id));
  const allowedProjectTypes = projectTypeIds.filter((id) => PROJECT_TYPE_ORDER.has(id));
  const allowedDeliverables = deliverableIds.filter((id) => DELIVERABLE_ORDER.has(id));

  if (!allowedWorkAreas.length && !allowedProjectTypes.length && !allowedDeliverables.length) {
    if (asset.type === "image") allowedWorkAreas.push("graphic-design");
    if (asset.type === "video") allowedWorkAreas.push("motion");
    if (asset.type === "model") allowedWorkAreas.push("3d");
  }

  return {
    workAreaIds: ordered(allowedWorkAreas, WORK_AREA_ORDER),
    projectTypeIds: ordered(allowedProjectTypes, PROJECT_TYPE_ORDER),
    deliverableIds: ordered(allowedDeliverables, DELIVERABLE_ORDER),
  };
}

function inferTags(classification) {
  const tags = [];
  const byWorkArea = {
    photography: "фото",
    production: "продакшен",
    illustration: "иллюстрация",
    "graphic-design": "графический дизайн",
    identity: "айдентика",
    motion: "моушен",
    "3d": "3D",
  };
  const byShootingType = {
    "music-shooting": "музыка",
    lookbook: "лукбук",
    catalog: "каталог",
    "campaign-shooting": "кампейн",
    editorial: "эдиториал",
    "scanography-project": "сканография",
    "book-design": "книжный дизайн",
  };
  for (const id of classification.workAreaIds) {
    if (byWorkArea[id]) tags.push(byWorkArea[id]);
  }
  for (const id of classification.projectTypeIds) {
    if (byShootingType[id]) tags.push(byShootingType[id]);
  }
  return unique(tags);
}

export function inferRegisteredMediaCatalogRecord(asset, entries = mediaEntries) {
  const assetEntries = entries.filter((entry) => entry.assetId === asset.id);
  const projectIds = inferProjectIds(asset, assetEntries);
  const classification = inferClassification(asset, assetEntries, projectIds);
  const assignedProjects = projectIds.map((id) => projectById.get(id)).filter(Boolean);
  const firstCaption = assetEntries.find((entry) => entry.caption?.title || entry.caption?.text)?.caption;
  const firstProject = assignedProjects[0];

  return {
    id: asset.id,
    ...registeredTechnicalValues(asset),
    title: firstCaption?.title || firstProject?.name || asset.id,
    alt: assetEntries.find((entry) => entry.alt?.trim())?.alt ?? "",
    description: firstCaption?.text ?? "",
    date: asset.date ?? firstProject?.date ?? "",
    projectIds,
    ...classification,
    tags: inferTags(classification),
    credits: unique(assetEntries.flatMap((entry) => entry.caption?.meta ?? [])),
    reusable: true,
    archived: false,
  };
}

function plannedVideoOutputSrc(src) {
  const clean = cleanSrc(src).replace(/^media\//, "");
  const parsed = path.posix.parse(clean);
  const dir = parsed.dir ? `${parsed.dir}/` : "";
  return `/media/generated/video/${dir}${parsed.name}.web.mp4`;
}

async function probeMedia(filePath) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  return JSON.parse(stdout);
}

export async function syncUploadedRecord(record, { repoRoot = process.cwd() } = {}) {
  const filePath = await resolvePublicFile(path.resolve(repoRoot), record.src);
  if (!filePath) throw new Error(`Uploaded media source does not exist: ${record.src}`);
  const fileStat = await stat(filePath);
  enforceCmsMediaUploadSize(record, fileStat.size);

  if (record.mediaType === "image") {
    const probe = await probeMedia(filePath);
    const image = probe.streams?.find((stream) => stream.codec_type === "video");
    if (!image?.width || !image?.height) {
      throw new Error(`Could not read uploaded image metadata: ${record.src}`);
    }
    return {
      ...record,
      deliverySrc: "",
      width: Number(image.width),
      height: Number(image.height),
      durationSeconds: 0,
      mimeType: mimeFor(record.src),
      byteLength: fileStat.size,
    };
  }

  if (record.mediaType !== "video") {
    throw new Error(`Unsupported uploaded media type: ${record.mediaType}`);
  }
  const probe = await probeMedia(filePath);
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  if (!video?.width || !video?.height) {
    throw new Error(`Could not read uploaded video metadata: ${record.src}`);
  }
  const bitrate = Number(probe.format?.bit_rate);
  const needsDelivery =
    extensionFor(record.src) !== "mp4"
    || video.codec_name !== "h264"
    || video.pix_fmt !== "yuv420p"
    || Number(video.width) > 2560
    || (Number.isFinite(bitrate) && bitrate > 16_000_000);

  return {
    ...record,
    deliverySrc: needsDelivery ? plannedVideoOutputSrc(record.src) : "",
    width: Number(video.width),
    height: Number(video.height),
    durationSeconds: Number(probe.format?.duration) || 0,
    mimeType: mimeFor(record.src),
    byteLength: fileStat.size,
  };
}

function importName(prefix, index) {
  return `${prefix}${String(index + 1).padStart(4, "0")}`;
}

export function renderMediaCatalogImportIndex({ registeredFilenames, uploadedFilenames }) {
  const registered = [...registeredFilenames].sort();
  const uploaded = [...uploadedFilenames].sort();
  const lines = [
    "/* This file is generated by tools/sync-media-catalog.mjs. Do not edit manually. */",
    "",
  ];
  registered.forEach((filename, index) => {
    lines.push(
      `import ${importName("registered", index)} from "../../content/media-catalog/registered/${filename}" with { type: "json" };`,
    );
  });
  uploaded.forEach((filename, index) => {
    lines.push(
      `import ${importName("uploaded", index)} from "../../content/media-catalog/uploads/${filename}" with { type: "json" };`,
    );
  });
  if (registered.length || uploaded.length) lines.push("");
  lines.push(
    `export const registeredMediaCatalogSources = [${registered.map((_, index) => importName("registered", index)).join(", ")}] as const;`,
    `export const uploadedMediaCatalogSources = [${uploaded.map((_, index) => importName("uploaded", index)).join(", ")}] as const;`,
    "",
  );
  return lines.join("\n");
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function jsonFilenames(directory) {
  return (await readdir(directory).catch(() => []))
    .filter((filename) => filename.endsWith(".json"))
    .sort();
}

async function changedFile(filePath, contents) {
  return (await readFile(filePath, "utf8").catch(() => null)) !== contents;
}

async function writeAtomic(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, filePath);
}

// CI may use this only for unchanged inputs with validated derivative cache.
// It checks tracked record/source consistency, never substitutes for ffprobe on
// changed inputs or for media:sync's deterministic correctness path.
export async function checkStoredUploadedRecord(record, { repoRoot = process.cwd() } = {}) {
  const filePath = await resolvePublicFile(path.resolve(repoRoot), record.src);
  if (!filePath) throw new Error(`Uploaded media source does not exist: ${record.src}`);
  const fileStat = await stat(filePath);
  enforceCmsMediaUploadSize(record, fileStat.size);
  if (!["image", "video"].includes(record.mediaType)
    || !(record.width > 0 && record.height > 0)
    || record.mimeType !== mimeFor(record.src)
    || record.byteLength !== fileStat.size) {
    throw new Error(`Stored uploaded metadata is stale: ${record.src}; run media:sync`);
  }
  return record;
}

export async function syncMediaCatalog({ repoRoot = process.cwd(), check = false, checkStored = false } = {}) {
  if (checkStored && !check) throw new Error("Stored metadata validation requires --check (read-only)");
  const root = path.resolve(repoRoot);
  const registeredDir = path.join(root, REGISTERED_DIR);
  const uploadedDir = path.join(root, UPLOADED_DIR);
  const generatedIndexPath = path.join(root, GENERATED_INDEX);
  await mkdir(registeredDir, { recursive: true });
  await mkdir(uploadedDir, { recursive: true });

  const changedPaths = [];
  const expectedRegisteredFilenames = [];
  const registeredIds = new Set(registeredMediaAssets.map(({ id }) => id));
  for (const asset of [...registeredMediaAssets].sort((left, right) => left.id.localeCompare(right.id))) {
    const filename = `${asset.id}.json`;
    const filePath = path.join(registeredDir, filename);
    const current = await readJson(filePath).catch(() => null);
    const seeded = current ?? inferRegisteredMediaCatalogRecord(asset);
    if (seeded.id !== asset.id) {
      throw new Error(`${path.relative(root, filePath)} id must match filename and MediaAsset`);
    }
    const next = {
      ...seeded,
      ...registeredTechnicalValues(asset),
    };
    const contents = `${JSON.stringify(next, null, 2)}\n`;
    if (await changedFile(filePath, contents)) {
      changedPaths.push(path.relative(root, filePath));
      if (!check) await writeAtomic(filePath, contents);
    }
    expectedRegisteredFilenames.push(filename);
  }

  for (const filename of await jsonFilenames(registeredDir)) {
    const id = filename.slice(0, -5);
    if (!registeredIds.has(id)) {
      throw new Error(`${path.join(REGISTERED_DIR, filename)} does not match a registered MediaAsset`);
    }
  }

  const uploadedFilenames = await jsonFilenames(uploadedDir);
  for (const filename of uploadedFilenames) {
    const filePath = path.join(uploadedDir, filename);
    const record = await readJson(filePath);
    if (`${record.id}.json` !== filename) {
      throw new Error(`${path.relative(root, filePath)} id must match filename`);
    }
    const next = await (checkStored ? checkStoredUploadedRecord : syncUploadedRecord)(record, { repoRoot: root });
    const contents = `${JSON.stringify(next, null, 2)}\n`;
    if (await changedFile(filePath, contents)) {
      changedPaths.push(path.relative(root, filePath));
      if (!check) await writeAtomic(filePath, contents);
    }
  }

  const generated = renderMediaCatalogImportIndex({
    registeredFilenames: expectedRegisteredFilenames,
    uploadedFilenames,
  });
  if (await changedFile(generatedIndexPath, generated)) {
    changedPaths.push(GENERATED_INDEX);
    if (!check) await writeAtomic(generatedIndexPath, generated);
  }

  if (check && changedPaths.length) {
    throw new Error(`Media catalog is stale:\n${changedPaths.map((item) => `- ${item}`).join("\n")}`);
  }

  return {
    registeredCount: expectedRegisteredFilenames.length,
    uploadedCount: uploadedFilenames.length,
    changedPaths,
  };
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  const result = await syncMediaCatalog({ check: process.argv.includes("--check"), checkStored: process.argv.includes("--check-stored") });
  console.log(
    `[media-catalog] ${result.registeredCount} registered, ${result.uploadedCount} uploaded, ${result.changedPaths.length} synchronized files`,
  );
}