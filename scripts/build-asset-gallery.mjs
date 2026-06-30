import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const htmlSkipDirs = new Set([
  ".git",
  ".vite",
  "_archive",
  "_lab",
  "_local",
  "_reports",
  "audit",
  "build",
  "dist",
  "dist-ssr",
  "node_modules",
  "out",
  "src",
  "temp",
  "tmp",
  "to-implement",
]);
const databaseDir = path.join(publicDir, "assets", "gallery", "database");
const customDir = path.join(publicDir, "assets", "gallery", "custom");
const manifestPath = path.join(publicDir, "assets", "gallery", "manifest.json");
const mediaPattern = /\.(webp|png|jpe?g|gif|svg|mp4|webm)$/i;
const videoPattern = /\.(mp4|webm)$/i;
const imagePattern = /\.(webp|png|jpe?g|gif|svg)$/i;

const toPublicPath = (absolutePath) => `/${path.relative(publicDir, absolutePath).replaceAll(path.sep, "/")}`;

const fromPublicPath = (publicPath) => path.join(publicDir, publicPath.replace(/^\//, ""));

const normalizePublicPath = (value) => value.replaceAll("\\", "/").replace(/^public\//, "/");

let sharpLoader;

async function getSharp() {
  if (sharpLoader !== undefined) return sharpLoader;

  try {
    sharpLoader = (await import("sharp")).default;
  } catch {
    sharpLoader = null;
  }

  return sharpLoader;
}

function naturalCompare(a, b) {
  return a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" });
}

async function listMediaFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...(await listMediaFiles(absolute)));
      } else if (mediaPattern.test(entry.name)) {
        result.push(toPublicPath(absolute));
      }
    }

    return result.sort(naturalCompare);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function listHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
    if (htmlSkipDirs.has(entry.name)) continue;

    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...(await listHtmlFiles(absolute)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      result.push(absolute);
    }
  }

  return result.sort(naturalCompare);
}

async function readHtmlAssetPaths(htmlPath) {
  const html = await fs.readFile(htmlPath, "utf8");
  const paths = [];
  const seen = new Set();
  const attrPattern = /\b(?:href|src)="(\/assets\/[^"]+\.(?:webp|png|jpe?g|gif|svg))"/gi;
  let match = attrPattern.exec(html);

  while (match) {
    const assetPath = normalizePublicPath(match[1]);

    if (!seen.has(assetPath)) {
      seen.add(assetPath);
      paths.push(assetPath);
    }

    match = attrPattern.exec(html);
  }

  return paths;
}

async function readSiteAssetPaths() {
  const paths = [];
  const seen = new Set();

  for (const htmlPath of await listHtmlFiles(rootDir)) {
    for (const assetPath of await readHtmlAssetPaths(htmlPath)) {
      if (seen.has(assetPath)) continue;
      seen.add(assetPath);
      paths.push(assetPath);
    }
  }

  return paths;
}

async function fileExists(publicPath) {
  try {
    await fs.access(fromPublicPath(publicPath));
    return true;
  } catch {
    return false;
  }
}

async function resolveVideoPoster(publicPath) {
  const ext = path.extname(publicPath);
  const candidate = publicPath.slice(0, -ext.length) + "-poster.webp";
  return (await fileExists(candidate)) ? candidate : "";
}

async function readDimensions(publicPath, type) {
  const sourcePath = type === "video" ? await resolveVideoPoster(publicPath) : publicPath;
  if (!sourcePath) return { width: 0, height: 0, ratio: 1 };

  const sharp = await getSharp();
  if (!sharp) return { width: 0, height: 0, ratio: 1 };

  try {
    const meta = await sharp(fromPublicPath(sourcePath)).metadata();
    const width = Number(meta.width || 0);
    const height = Number(meta.height || 0);
    return {
      width,
      height,
      ratio: width && height ? width / height : 1,
    };
  } catch {
    return { width: 0, height: 0, ratio: 1 };
  }
}

function inferProject(publicPath) {
  if (publicPath.includes("/jesteipool/") || publicPath.includes("/jestei/")) return "jesteipool";
  if (publicPath.includes("/styx/")) return "styx";
  if (publicPath.includes("/shootings/")) return "shootings";
  if (publicPath.includes("/pets/")) return "pets";
  return "pets";
}

function inferCategory(publicPath, project, type) {
  if (project === "shootings") return "photo";
  if (type === "video") return "ad";
  if (publicPath.includes("/01-logo/") || publicPath.includes("/branding/")) return "illustration";
  if (publicPath.includes("/02-color/")) return "illustration";
  if (publicPath.includes("/03-form/")) return "banner";
  if (publicPath.includes("/04-depth/")) return "illustration";
  if (publicPath.includes("/05-motion/")) return "banner";
  if (publicPath.includes("/06-graphic/")) return "social";
  if (publicPath.includes("/07-tone-of-voice/")) return "social";
  if (publicPath.includes("/02-print/")) return "poster";
  if (publicPath.includes("/03/")) return "photo";
  if (project === "styx") return "illustration";
  if (project === "pets") return "banner";
  return "illustration";
}

function inferTags(publicPath, project, type) {
  const tags = new Set();

  if (type === "video" || publicPath.includes("motion")) tags.add("motion");
  if (publicPath.includes("color") || publicPath.includes("branding")) tags.add("color");
  if (publicPath.includes("form") || publicPath.includes("landing") || publicPath.includes("motion")) tags.add("landing");
  if (publicPath.includes("tone") || publicPath.includes("language") || publicPath.includes("graphic")) tags.add("editorial");
  if (publicPath.includes("depth") || project === "styx") tags.add("3d");
  if (project === "shootings") tags.add("event");
  if (publicPath.includes("graphic")) tags.add("ai");

  return [...tags];
}

function inferVariant(ratio, type) {
  if (type === "video" && ratio < 0.72) return "story";
  if (ratio >= 2.05) return "banner";
  if (ratio >= 1.16) return "wide";
  if (ratio <= 0.64) return "tall";
  if (ratio <= 0.9) return "portrait";
  return "square";
}

function makeTitle(publicPath) {
  const file = decodeURIComponent(path.posix.basename(publicPath).replace(/\.[^.]+$/, ""));
  return file.replace(/[-_]+/g, " ");
}

async function createItem(publicPath, index) {
  const type = videoPattern.test(publicPath) ? "video" : "image";
  const project = inferProject(publicPath);
  const category = inferCategory(publicPath, project, type);
  const tags = inferTags(publicPath, project, type);
  const dimensions = await readDimensions(publicPath, type);
  const poster = type === "video" ? await resolveVideoPoster(publicPath) : "";

  return {
    id: `asset-${String(index + 1).padStart(3, "0")}`,
    src: publicPath,
    type,
    project,
    category,
    tags,
    title: makeTitle(publicPath),
    width: dimensions.width,
    height: dimensions.height,
    ratio: Number(dimensions.ratio.toFixed(4)),
    variant: inferVariant(dimensions.ratio, type),
    ...(poster ? { poster } : {}),
  };
}

async function main() {
  await fs.mkdir(databaseDir, { recursive: true });
  await fs.mkdir(customDir, { recursive: true });
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });

  const paths = [];
  const seen = new Set();
  const addPath = async (assetPath) => {
    if (!mediaPattern.test(assetPath)) return;
    if (!imagePattern.test(assetPath)) return;
    if (seen.has(assetPath)) return;
    if (!(await fileExists(assetPath))) return;

    seen.add(assetPath);
    paths.push(assetPath);
  };

  for (const assetPath of await readSiteAssetPaths()) {
    await addPath(assetPath);
  }

  for (const assetPath of await listMediaFiles(databaseDir)) {
    await addPath(assetPath);
  }

  for (const assetPath of await listMediaFiles(customDir)) {
    await addPath(assetPath);
  }

  const items = [];
  for (const [index, assetPath] of paths.entries()) {
    items.push(await createItem(assetPath, index));
  }

  const manifest = {
    sources: ["site html", "/assets/gallery/database", "/assets/gallery/custom"],
    items,
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`asset gallery: ${items.length} files -> ${path.relative(rootDir, manifestPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
