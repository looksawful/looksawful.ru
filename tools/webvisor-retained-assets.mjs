import {
  appendFile,
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DAY_MS = 24 * 60 * 60 * 1000;
export const RETENTION_MS = 16 * DAY_MS;
export const MAX_RETAINED_BYTES = 256 * 1024 * 1024;
const MANIFEST_VERSION = 1;

function isNotFound(error) {
  return Boolean(error && typeof error === "object" && error.code === "ENOENT");
}

function normalizeRelativeAssetPath(value) {
  if (typeof value !== "string" || !value || value.includes("\0")) {
    throw new Error(`invalid retained asset path: ${String(value)}`);
  }
  const normalized = value.replaceAll("\\", "/");
  if (
    path.posix.isAbsolute(normalized)
    || normalized === "."
    || normalized === ".."
    || normalized.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new Error(`invalid retained asset path: ${value}`);
  }
  return normalized;
}

async function listFiles(root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }

  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      for (const nested of await listFiles(absolute)) {
        files.push(path.posix.join(entry.name, nested));
      }
      continue;
    }
    if (entry.isFile()) files.push(entry.name);
  }
  return files;
}

async function readManifest(cacheDir) {
  const manifestPath = path.join(cacheDir, "manifest.json");
  let raw;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch (error) {
    if (isNotFound(error)) return { version: MANIFEST_VERSION, assets: {} };
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`invalid retained asset manifest JSON: ${error.message}`);
  }
  if (parsed?.version !== MANIFEST_VERSION || !parsed.assets || typeof parsed.assets !== "object") {
    throw new Error("invalid retained asset manifest shape");
  }

  const assets = {};
  for (const [rawPath, entry] of Object.entries(parsed.assets)) {
    const relativePath = normalizeRelativeAssetPath(rawPath);
    const firstSeenMs = Number(entry?.firstSeenMs);
    const lastSeenMs = Number(entry?.lastSeenMs ?? entry?.firstSeenMs);
    const size = Number(entry?.size);
    if (
      !Number.isFinite(firstSeenMs)
      || firstSeenMs < 0
      || !Number.isFinite(lastSeenMs)
      || lastSeenMs < firstSeenMs
      || !Number.isFinite(size)
      || size < 0
    ) {
      throw new Error(`invalid retained asset manifest entry: ${relativePath}`);
    }
    assets[relativePath] = { firstSeenMs, lastSeenMs, size };
  }
  return { version: MANIFEST_VERSION, assets };
}

async function sameFileContents(left, right) {
  const [leftStat, rightStat] = await Promise.all([stat(left), stat(right)]);
  if (leftStat.size !== rightStat.size) return false;
  const [leftBuffer, rightBuffer] = await Promise.all([readFile(left), readFile(right)]);
  return leftBuffer.equals(rightBuffer);
}

async function ensureParent(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

function stableManifest(assets) {
  return {
    version: MANIFEST_VERSION,
    assets: Object.fromEntries(
      Object.entries(assets).sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
}

export async function prepareRetainedAssets({
  distDir,
  cacheDir,
  nowMs = Date.now(),
  retentionMs = RETENTION_MS,
  maxBytes = MAX_RETAINED_BYTES,
}) {
  if (!distDir || !cacheDir) throw new Error("distDir and cacheDir are required");
  if (!Number.isFinite(nowMs) || nowMs < 0) throw new Error("nowMs must be a non-negative number");
  if (!Number.isFinite(retentionMs) || retentionMs <= 0) throw new Error("retentionMs must be positive");
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) throw new Error("maxBytes must be positive");

  const distAssetsDir = path.join(distDir, "assets");
  const cacheAssetsDir = path.join(cacheDir, "assets");
  await mkdir(distAssetsDir, { recursive: true });
  await mkdir(cacheAssetsDir, { recursive: true });

  const manifest = await readManifest(cacheDir);
  const pruned = [];

  for (const relativePath of Object.keys(manifest.assets).sort()) {
    const entry = manifest.assets[relativePath];
    if (nowMs - entry.lastSeenMs <= retentionMs) continue;
    await rm(path.join(cacheAssetsDir, relativePath), { force: true });
    delete manifest.assets[relativePath];
    pruned.push(relativePath);
  }

  const currentFiles = (await listFiles(distAssetsDir)).map(normalizeRelativeAssetPath);
  const currentSet = new Set(currentFiles);
  const retainedPrevious = [];

  for (const relativePath of Object.keys(manifest.assets).sort()) {
    const cachedPath = path.join(cacheAssetsDir, relativePath);
    try {
      await stat(cachedPath);
    } catch (error) {
      if (isNotFound(error)) {
        throw new Error(`retained asset missing from cache: ${relativePath}`);
      }
      throw error;
    }

    const distPath = path.join(distAssetsDir, relativePath);
    if (currentSet.has(relativePath)) {
      if (!(await sameFileContents(cachedPath, distPath))) {
        throw new Error(`immutable asset collision for ${relativePath}`);
      }
      continue;
    }

    await ensureParent(distPath);
    await copyFile(cachedPath, distPath);
    retainedPrevious.push(relativePath);
  }

  for (const relativePath of currentFiles) {
    const distPath = path.join(distAssetsDir, relativePath);
    const cachedPath = path.join(cacheAssetsDir, relativePath);
    const fileStat = await stat(distPath);
    const previous = manifest.assets[relativePath];

    if (previous) {
      if (!(await sameFileContents(cachedPath, distPath))) {
        throw new Error(`immutable asset collision for ${relativePath}`);
      }
      manifest.assets[relativePath] = {
        firstSeenMs: previous.firstSeenMs,
        lastSeenMs: nowMs,
        size: fileStat.size,
      };
      continue;
    }

    await ensureParent(cachedPath);
    await copyFile(distPath, cachedPath);
    manifest.assets[relativePath] = {
      firstSeenMs: nowMs,
      lastSeenMs: nowMs,
      size: fileStat.size,
    };
  }

  const livePaths = new Set(Object.keys(manifest.assets));
  for (const relativePath of await listFiles(cacheAssetsDir)) {
    if (!livePaths.has(relativePath)) {
      await rm(path.join(cacheAssetsDir, relativePath), { force: true });
    }
  }

  const totalBytes = Object.values(manifest.assets)
    .reduce((sum, entry) => sum + entry.size, 0);
  if (totalBytes > maxBytes) {
    throw new Error(
      `retained asset pool exceeds ${maxBytes} bytes: ${totalBytes} bytes across ${livePaths.size} assets`,
    );
  }

  await writeFile(
    path.join(cacheDir, "manifest.json"),
    `${JSON.stringify(stableManifest(manifest.assets), null, 2)}\n`,
    "utf8",
  );

  return {
    retainedPrevious,
    pruned,
    totalBytes,
    assetCount: livePaths.size,
  };
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dist") options.distDir = argv[++index];
    else if (arg === "--cache") options.cacheDir = argv[++index];
    else if (arg === "--now-ms") options.nowMs = Number(argv[++index]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

async function runCli() {
  const result = await prepareRetainedAssets(parseArgs(process.argv.slice(2)));
  const retainedCss = result.retainedPrevious.find((asset) => asset.endsWith(".css")) ?? "";
  console.log(
    `[webvisor-assets] retained=${result.retainedPrevious.length} pruned=${result.pruned.length} pool=${result.assetCount} bytes=${result.totalBytes}`,
  );
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `retained_css=${retainedCss}\n`, "utf8");
  }
}

const direct = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (direct) await runCli();
