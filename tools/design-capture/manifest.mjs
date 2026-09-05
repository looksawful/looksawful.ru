import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function createManifest({ mode, outputDir, source = {} }) {
  return {
    schemaVersion: 1,
    tool: "looksawful-design-capture",
    createdAt: new Date().toISOString(),
    mode,
    outputDir,
    source,
    captures: [],
    warnings: [],
  };
}

export function addCapture(manifest, capture) {
  manifest.captures.push(capture);
  return capture;
}

export function addWarning(manifest, warning) {
  manifest.warnings.push({
    message: String(warning),
    at: new Date().toISOString(),
  });
}

export async function writeManifest(manifest, outputDir) {
  await mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, "manifest.json");
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return filePath;
}
