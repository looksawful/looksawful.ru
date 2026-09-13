import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MEDIA_REFERENCE = /\/(?:media|pets)\/[^\s"'`()<>]+?\.(?:avif|gif|jpe?g|png|svg|webp|m4v|mov|mp4|webm|glb|gltf)(?:[?#][^\s"'`()<>]*)?/giu;
const SOURCE_EXTENSIONS = new Set([".css", ".html", ".js", ".mjs", ".ts"]);

function normalizedReference(value) {
  return value.split(/[?#]/u, 1)[0];
}

function assetPaths(item) {
  const values = [item?.asset?.src];
  if (item?.asset?.type === "video") values.push(item.asset.sourceSrc);
  return values.filter((value) => typeof value === "string" && value.startsWith("/"));
}

function compareRecord(left, right) {
  return left.ownerId.localeCompare(right.ownerId)
    || left.sourcePath.localeCompare(right.sourcePath)
    || left.referencedPath.localeCompare(right.referencedPath)
    || (left.assetId ?? "").localeCompare(right.assetId ?? "");
}

export function indexPageMediaSources({ sources, catalog }) {
  if (!Array.isArray(sources) || !Array.isArray(catalog)) {
    throw new TypeError("Page media index requires source and catalog arrays");
  }

  const assetIdByPath = new Map();
  for (const item of catalog) {
    const assetId = item?.asset?.id;
    if (typeof assetId !== "string" || !assetId) continue;
    for (const assetPath of assetPaths(item)) {
      const existing = assetIdByPath.get(assetPath);
      if (existing && existing !== assetId) {
        throw new Error(`Ambiguous canonical media path: ${assetPath}`);
      }
      assetIdByPath.set(assetPath, assetId);
    }
  }

  const records = [];
  const unresolved = [];
  const seenRecords = new Set();
  const seenUnresolved = new Set();

  for (const source of sources) {
    const ownerId = String(source?.ownerId ?? "").trim();
    const route = String(source?.route ?? "").trim();
    const sourcePath = String(source?.sourcePath ?? "").replaceAll("\\", "/");
    const text = typeof source?.text === "string" ? source.text : "";
    if (!ownerId || !route || !sourcePath) {
      throw new Error("Page media source is missing ownerId, route or sourcePath");
    }

    const references = [...text.matchAll(MEDIA_REFERENCE)]
      .map((match) => normalizedReference(match[0]))
      .sort();

    for (const referencedPath of references) {
      const assetId = assetIdByPath.get(referencedPath);
      if (assetId) {
        const identity = [assetId, ownerId, route, sourcePath, referencedPath].join("\u0000");
        if (seenRecords.has(identity)) continue;
        seenRecords.add(identity);
        records.push({ assetId, ownerId, route, sourcePath, referencedPath });
        continue;
      }

      const identity = [ownerId, route, sourcePath, referencedPath].join("\u0000");
      if (seenUnresolved.has(identity)) continue;
      seenUnresolved.add(identity);
      unresolved.push({ ownerId, route, sourcePath, referencedPath });
    }
  }

  records.sort(compareRecord);
  unresolved.sort(compareRecord);
  return { records, unresolved };
}

async function collectPetSources(root) {
  const petRoot = path.join(root, "public", "pets");
  const files = await readdir(petRoot, { recursive: true, withFileTypes: true });
  const sources = [];

  for (const entry of files) {
    if (!entry.isFile()) continue;
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const absolute = path.join(entry.parentPath, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
    const petRelative = path.relative(petRoot, absolute).replaceAll(path.sep, "/");
    const ownerId = petRelative.split("/", 1)[0];
    if (!ownerId) continue;
    sources.push({
      ownerId,
      route: `/pets/${ownerId}/`,
      sourcePath: relative,
      text: await readFile(absolute, "utf8"),
    });
  }

  return sources.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
}

async function runCli() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const [{ mediaCatalogItems }, sources] = await Promise.all([
    import("../../src/data/media/catalog-view.ts"),
    collectPetSources(root),
  ]);
  const indexed = indexPageMediaSources({ sources, catalog: mediaCatalogItems });
  const output = path.join(root, "src", "data", "media", "page-usage.generated.json");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(indexed, null, 2)}\n`, "utf8");
  process.stdout.write(
    `[media-desk-page-index] ${indexed.records.length} canonical refs; ${indexed.unresolved.length} unresolved refs\n`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runCli();
}
