import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { decodeEntities } from "./site-html-utils.mjs";

const ROOT = process.cwd();
const MEDIA_ROOT = path.join(
  ROOT,
  "public/media/projects/shootings/behance",
);
const ASSETS_FILE = path.join(
  ROOT,
  "src/data/media/assets/behance-shootings.ts",
);
const ENTRIES_FILE = path.join(
  ROOT,
  "src/data/media/entries/behance-shootings.ts",
);
const MANIFEST_FILE = path.join(MEDIA_ROOT, "manifest.json");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36";

const projects = [
  {
    slug: "photography-and-digital-art-for-obladaet",
    title: "Photography and digital art for Obladaet",
    url: "https://www.behance.net/gallery/115847377/Photography-and-digital-art-for-Obladaet",
  },
  {
    slug: "ecobasik",
    title: "Lookbook for Ecobasik",
    url: "https://www.behance.net/gallery/110306381/Lookbook-for-Ecobasik",
    coverUrl:
      "https://mir-s3-cdn-cf.behance.net/projects/404/788c62110306381.Y3JvcCwxMTQ4LDg5NywwLDU2.jpg",
  },
  {
    slug: "obladaet-content-covers",
    title: "Obladaet content&covers",
    url: "https://www.behance.net/gallery/105880237/Obladaet-content-covers",
  },
  {
    slug: "hypression",
    title: "Hypression",
    url: "https://www.behance.net/gallery/105881649/Hypression",
  },
  {
    slug: "offmi",
    title: "Offmi",
    url: "https://www.behance.net/gallery/105879709/Offmi",
    coverUrl:
      "https://mir-s3-cdn-cf.behance.net/projects/404/0ad085105879709.Y3JvcCwxNDAwLDEwOTUsMCww.jpg",
  },
  {
    slug: "cinema-stills-2",
    title: "CINEMA STILLS 2",
    url: "https://www.behance.net/gallery/102556771/CINEMA-STILLS-2",
    coverUrl:
      "https://mir-s3-cdn-cf.behance.net/projects/404/a16fa0102556771.Y3JvcCwyMDQ4LDE2MDEsMCw0ODE.jpg",
  },
  {
    slug: "anka-model-tests",
    title: "Anka model tests",
    url: "https://www.behance.net/gallery/95512193/Anka-model-tests",
    coverUrl:
      "https://mir-s3-cdn-cf.behance.net/projects/404/517d8b95512193.Y3JvcCwxNjQ3LDEyODgsMjIwLDM4Nw.jpg",
  },
  {
    slug: "choose-your-character",
    title: "Choose your character",
    url: "https://www.behance.net/gallery/108292501/Choose-your-character",
    coverUrl:
      "https://mir-s3-cdn-cf.behance.net/projects/404/4b62d7108292501.Y3JvcCwzMDcwLDI0MDEsMCww.jpg",
  },
  {
    slug: "editorial-photography",
    title: "Editorial photography",
    url: "https://www.behance.net/gallery/102725909/Editorial-photography",
    coverUrl:
      "https://mir-s3-cdn-cf.behance.net/projects/404/eedfe7102725909.5fae7d6d16dc4.jpg",
  },
];

const escapeTs = (value) => JSON.stringify(value);

function htmlEntityDecode(value) {
  return decodeEntities(value);
}

function extractStoreState(html) {
  const match = html.match(
    /<script[^>]+id=["']beconfig-store_state["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (!match) return null;

  const raw = htmlEntityDecode(match[1].trim());

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Could not parse Behance store state: ${error.message}`);
    return null;
  }
}

function normalizeEscapedUrl(value) {
  return value
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&");
}

function collectImageCandidates(value, output = []) {
  if (!value) return output;

  if (Array.isArray(value)) {
    for (const item of value) collectImageCandidates(item, output);
    return output;
  }

  if (typeof value === "object") {
    if (
      value.sizes &&
      typeof value.sizes === "object" &&
      typeof value.sizes.original === "string"
    ) {
      output.push(value.sizes.original);
    }

    for (const nested of Object.values(value)) {
      collectImageCandidates(nested, output);
    }
    return output;
  }

  if (
    typeof value === "string" &&
    value.includes("behance.net/project_modules/")
  ) {
    output.push(value);
  }

  return output;
}

function urlsFromHtml(html) {
  const normalized = normalizeEscapedUrl(html);
  return (
    normalized.match(
      /https:\/\/mir-s3-cdn-cf\.behance\.net\/project_modules\/[A-Za-z0-9_-]+\/[^"'<>\s\\]+/g,
    ) ?? []
  );
}

function mediaKey(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const modulesIndex = parts.indexOf("project_modules");
    if (modulesIndex >= 0 && parts[modulesIndex + 2]) {
      return parts.slice(modulesIndex + 2).join("/").split("?")[0];
    }
    return parsed.pathname.split("/").pop()?.split("?")[0] ?? url;
  } catch {
    return url;
  }
}

function preferLargestUrls(urls) {
  const priority = new Map([
    ["source", 5],
    ["max_1920", 4],
    ["max_1200", 3],
    ["1400", 2],
    ["disp", 1],
  ]);
  const selected = new Map();

  for (const raw of urls) {
    const url = normalizeEscapedUrl(raw).replace(/[),.;]+$/, "");
    if (!/^https:\/\/mir-s3-cdn-cf\.behance\.net\//.test(url)) continue;

    const rendition = url.match(/\/project_modules\/([^/]+)\//)?.[1] ?? "";
    const score = priority.get(rendition) ?? 0;
    const key = mediaKey(url);
    const previous = selected.get(key);

    if (!previous || score > previous.score) {
      selected.set(key, { url, score });
    }
  }

  return [...selected.values()].map((item) => item.url);
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.8",
      Referer: "https://www.behance.net/",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

async function discoverProjectImages(project) {
  const discovered = [];
  let html = "";

  try {
    html = await fetchText(project.url);
    const state = extractStoreState(html);
    const projectData = state?.project?.project;
    collectImageCandidates(projectData?.modules ?? projectData, discovered);
    discovered.push(...urlsFromHtml(html));
  } catch (error) {
    console.warn(`Behance page fetch failed for ${project.slug}: ${error.message}`);
  }

  if (!discovered.length) {
    try {
      const mirror = await fetchText(`https://r.jina.ai/${project.url}`);
      discovered.push(...urlsFromHtml(mirror));
    } catch (error) {
      console.warn(`Jina fallback failed for ${project.slug}: ${error.message}`);
    }
  }

  const unique = preferLargestUrls(discovered);

  if (!unique.length) {
    throw new Error(`No Behance project-module images found for ${project.url}`);
  }

  return unique;
}

function renditionCandidates(url) {
  const candidates = [url];
  const match = url.match(/^(.*\/project_modules\/)([^/]+)(\/.*)$/);

  if (match) {
    for (const rendition of ["source", "max_1920", "max_1200", "1400", "disp"]) {
      candidates.push(`${match[1]}${rendition}${match[3]}`);
    }
  }

  return [...new Set(candidates)];
}

async function fetchBinary(url, referer) {
  let lastError;

  for (const candidate of renditionCandidates(url)) {
    try {
      const response = await fetch(candidate, {
        redirect: "follow",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: referer,
        },
      });

      if (!response.ok) {
        lastError = new Error(`${response.status} ${response.statusText} for ${candidate}`);
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) {
        lastError = new Error(`Unexpected content type ${contentType} for ${candidate}`);
        continue;
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error(`Unable to download ${url}`);
}

async function writeWebp(buffer, filePath) {
  const pipeline = sharp(buffer, { animated: false }).rotate();
  const metadata = await pipeline.metadata();

  await pipeline.webp({ quality: 92, effort: 5 }).toFile(filePath);

  return {
    width: metadata.width,
    height: metadata.height,
  };
}

function makeAssetId(slug, index) {
  return `behance-${slug}-${String(index).padStart(3, "0")}`;
}

async function importProject(project) {
  const directory = path.join(MEDIA_ROOT, project.slug);
  const sourceDirectory = path.join(directory, "source");

  await rm(directory, { recursive: true, force: true });
  await mkdir(sourceDirectory, { recursive: true });

  const moduleUrls = await discoverProjectImages(project);
  const assets = [];
  const entries = [];
  const files = [];

  for (const [index, url] of moduleUrls.entries()) {
    const number = index + 1;
    const assetId = makeAssetId(project.slug, number);
    const fileName = `${String(number).padStart(3, "0")}.webp`;
    const filePath = path.join(sourceDirectory, fileName);
    const buffer = await fetchBinary(url, project.url);
    const dimensions = await writeWebp(buffer, filePath);
    const src = `/media/projects/shootings/behance/${project.slug}/source/${fileName}`;

    assets.push({
      id: assetId,
      type: "image",
      src,
      ...dimensions,
    });
    entries.push({
      id: `${assetId}-use-01`,
      assetId,
      alt: `${project.title} — кадр ${number}`,
    });
    files.push({ src, source: url, ...dimensions });
  }

  let cover = null;
  if (project.coverUrl) {
    const coverPath = path.join(directory, "cover.webp");
    const coverBuffer = await fetchBinary(project.coverUrl, project.url);
    const dimensions = await writeWebp(coverBuffer, coverPath);
    const assetId = `behance-${project.slug}-cover`;
    const src = `/media/projects/shootings/behance/${project.slug}/cover.webp`;

    assets.unshift({ id: assetId, type: "image", src, ...dimensions });
    entries.unshift({
      id: `${assetId}-use-01`,
      assetId,
      alt: project.title,
      caption: { title: project.title },
    });
    cover = { src, source: project.coverUrl, ...dimensions };
  }

  console.log(`${project.title}: ${moduleUrls.length} project images${cover ? " + cover" : ""}`);

  return {
    slug: project.slug,
    title: project.title,
    url: project.url,
    cover,
    files,
    assets,
    entries,
  };
}

function renderAssetsFile(assets) {
  const rows = assets
    .map(
      (asset) => `  {\n    id: ${escapeTs(asset.id)},\n    type: "image",\n    src: ${escapeTs(asset.src)},\n    width: ${asset.width ?? "undefined"},\n    height: ${asset.height ?? "undefined"},\n  },`,
    )
    .join("\n");

  return `import type { MediaAsset } from "../../../types/media.ts";\n\nexport const behanceShootingMediaAssets = [\n${rows}\n] as const satisfies readonly MediaAsset[];\n`;
}

function renderEntriesFile(entries) {
  const rows = entries
    .map((entry) => {
      const caption = entry.caption
        ? `\n    caption: { title: ${escapeTs(entry.caption.title)} },`
        : "";
      return `  {\n    id: ${escapeTs(entry.id)},\n    assetId: ${escapeTs(entry.assetId)},\n    alt: ${escapeTs(entry.alt)},${caption}\n  },`;
    })
    .join("\n");

  return `import type { MediaEntryData } from "../../../types/media.ts";\nimport type { MediaAssetId } from "../assets/index.ts";\n\nexport const behanceShootingMediaEntries = [\n${rows}\n] as const satisfies readonly MediaEntryData<MediaAssetId>[];\n`;
}

await mkdir(MEDIA_ROOT, { recursive: true });

const imported = [];
for (const project of projects) {
  imported.push(await importProject(project));
}

const allAssets = imported.flatMap((project) => project.assets);
const allEntries = imported.flatMap((project) => project.entries);

await writeFile(ASSETS_FILE, renderAssetsFile(allAssets), "utf8");
await writeFile(ENTRIES_FILE, renderEntriesFile(allEntries), "utf8");
await writeFile(
  MANIFEST_FILE,
  `${JSON.stringify(
    {
      source: "https://www.behance.net/looksawful",
      generatedAt: new Date().toISOString(),
      projects: imported.map(({ assets: _assets, entries: _entries, ...project }) => project),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Imported ${allAssets.length} Behance image assets across ${imported.length} projects.`);
