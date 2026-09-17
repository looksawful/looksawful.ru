import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const manifestPath = path.join(root, "tools/logo-3d/logo-3d-manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const formats = manifest.exportFormats;

const items = [];
for (const target of manifest.targets) {
  if (target.sourceType !== "vector-svg" || target.status !== "ready") continue;
  const glbRel = target.packOutput ?? target.output;
  const dir = path.posix.dirname(glbRel);
  const stem = path.posix.basename(glbRel, ".glb");
  const metadataRel = path.posix.join(dir, "metadata", `${stem}.json`);
  const metadata = JSON.parse(await readFile(path.join(root, ...metadataRel.split("/")), "utf8"));

  const files = Object.fromEntries(
    formats.map((format) => [format, `/${path.posix.join(dir, `${stem}.${format}`)}`]),
  );
  items.push({
    id: target.id,
    family: target.family,
    variant: target.variant,
    colorway: target.colorway ?? null,
    materialId: target.materialId,
    source: `/${target.source}`,
    sourceSha256: metadata.sourceSha256,
    dimensions: metadata.dimensions,
    files,
    preview: `/${path.posix.join(dir, "preview", `${stem}.png`)}`,
    metadata: `/${metadataRel}`,
    referenceModel: target.packOutput ? `/${target.output}` : null,
  });
}

items.sort((a, b) => a.family.localeCompare(b.family) || a.variant.localeCompare(b.variant) || (a.colorway ?? "").localeCompare(b.colorway ?? ""));
const output = {
  version: 1,
  generatedFrom: "/tools/logo-3d/logo-3d-manifest.json",
  geometryProfile: manifest.defaultGeometryProfile,
  formats,
  items,
};
const outPath = path.join(root, "public/media/logo-3d/index.json");
await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`[logo-3d] wrote ${items.length} ready packs to ${path.relative(root, outPath)}`);
