import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

const ICONS = Object.freeze([
  { filename: "favicon.png", size: 120 },
  { filename: "apple-touch-icon.png", size: 180 },
]);

export async function generateSiteIcons({
  source = "public/favicon.svg",
  distDir = "dist",
} = {}) {
  const sourcePath = path.resolve(source);
  const outputRoot = path.resolve(distDir);
  await mkdir(outputRoot, { recursive: true });

  const generated = [];
  for (const icon of ICONS) {
    const outputPath = path.join(outputRoot, icon.filename);
    await sharp(sourcePath)
      .resize(icon.size, icon.size, { fit: "contain" })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    if (
      metadata.format !== "png"
      || metadata.width !== icon.size
      || metadata.height !== icon.size
    ) {
      throw new Error(
        `${icon.filename}: expected ${icon.size}x${icon.size} PNG, got ${metadata.format ?? "unknown"} ${metadata.width ?? "?"}x${metadata.height ?? "?"}`,
      );
    }
    generated.push(icon.filename);
  }

  return generated;
}

const isCli = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCli) {
  try {
    const generated = await generateSiteIcons();
    console.log(`[site-icons] generated ${generated.join(", ")}`);
  } catch (error) {
    console.error(`[site-icons] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
