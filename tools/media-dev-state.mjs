import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mediaAssets } from "../src/data/media/assets/index.ts";

const STATE_VERSION = 1;
const DEFAULT_STATE_PATH = ".cache/media/dev-state.json";
const DEFAULT_RESPONSIVE_MANIFEST = "public/media/generated/responsive-manifest.json";
const DEFAULT_VIDEO_INVENTORY = "public/media/generated/video-inventory.json";
const DEFAULT_CONFIG_FILES = [
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "src/data/media/responsive-policy.ts",
  "package-lock.json",
];

function normalizeSlashes(value) {
  return String(value).replace(/\\/g, "/");
}

function normalizePublicSrc(src) {
  return String(src)
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "");
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveMediaFile(repoRoot, src) {
  const clean = normalizePublicSrc(src);
  const candidates = [
    path.join(repoRoot, clean),
    path.join(repoRoot, "public", clean),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return path.resolve(candidate);
  }

  return null;
}

function hashText(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function hashSmallFile(filePath) {
  return hashText(await readFile(filePath));
}

function registrySignature(assets) {
  const normalized = assets
    .map((asset) => ({
      id: String(asset.id),
      type: String(asset.type),
      src: String(asset.src),
      sourceSrc: asset.sourceSrc == null ? null : String(asset.sourceSrc),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  return hashText(JSON.stringify(normalized));
}

async function collectSourceFingerprint(repoRoot, assets) {
  const byPath = new Map();

  for (const asset of assets) {
    const sourceSrc = asset.sourceSrc ?? asset.src;
    const sourcePath = await resolveMediaFile(repoRoot, sourceSrc);
    if (!sourcePath) {
      throw new Error(`media source is missing: ${sourceSrc}`);
    }

    const normalizedPath = normalizeSlashes(sourcePath);
    if (byPath.has(normalizedPath)) continue;
    const fileStat = await stat(sourcePath);
    byPath.set(normalizedPath, {
      path: normalizedPath,
      size: fileStat.size,
      mtimeMs: fileStat.mtimeMs,
    });
  }

  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

async function collectConfigFingerprint(repoRoot, configFiles) {
  const records = [];
  for (const relativePath of configFiles) {
    const filePath = path.resolve(repoRoot, relativePath);
    if (!(await exists(filePath))) {
      throw new Error(`media config/tool file is missing: ${relativePath}`);
    }
    records.push({
      path: normalizeSlashes(relativePath),
      hash: await hashSmallFile(filePath),
    });
  }
  return records.sort((left, right) => left.path.localeCompare(right.path));
}

async function readJsonFile(filePath, label) {
  let contents;
  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { value: null, hash: null, error: `${label} is missing` };
    }
    throw error;
  }

  try {
    return { value: JSON.parse(contents), hash: hashText(contents), error: null };
  } catch {
    return { value: null, hash: null, error: `${label} is invalid JSON` };
  }
}

async function validateGeneratedOutputs(repoRoot, responsiveManifest, videoInventory) {
  const reasons = [];

  for (const asset of responsiveManifest?.assets ?? []) {
    for (const variant of asset?.variants ?? []) {
      if (!variant?.src) continue;
      const outputPath = path.join(repoRoot, "public", normalizePublicSrc(variant.src));
      const outputStat = await stat(outputPath).catch(() => null);
      if (!outputStat) {
        reasons.push(`responsive output is missing: ${variant.src}`);
        continue;
      }
      if (Number.isFinite(variant.bytes) && outputStat.size !== variant.bytes) {
        reasons.push(`responsive output byte size changed: ${variant.src}`);
      }
    }
  }

  for (const video of videoInventory?.videos ?? []) {
    if (!video?.outputSrc) continue;
    const outputPath = path.join(repoRoot, "public", normalizePublicSrc(video.outputSrc));
    const outputStat = await stat(outputPath).catch(() => null);
    if (!outputStat) {
      reasons.push(`generated video output is missing: ${video.outputSrc}`);
      continue;
    }
    if (Number.isFinite(video.outputBytes) && outputStat.size !== video.outputBytes) {
      reasons.push(`generated video output byte size changed: ${video.outputSrc}`);
    }
  }

  return reasons;
}

async function collectCurrentState({
  repoRoot,
  assets,
  configFiles,
  responsiveManifestPath,
  videoInventoryPath,
}) {
  const responsive = await readJsonFile(responsiveManifestPath, "responsive manifest");
  const video = await readJsonFile(videoInventoryPath, "video inventory");
  const reasons = [responsive.error, video.error].filter(Boolean);
  if (reasons.length) return { state: null, reasons };

  const outputReasons = await validateGeneratedOutputs(repoRoot, responsive.value, video.value);
  if (outputReasons.length) return { state: null, reasons: outputReasons };

  try {
    const [sources, config] = await Promise.all([
      collectSourceFingerprint(repoRoot, assets),
      collectConfigFingerprint(repoRoot, configFiles),
    ]);

    return {
      state: {
        version: STATE_VERSION,
        registrySignature: registrySignature(assets),
        sources,
        config,
        responsiveManifestHash: responsive.hash,
        videoInventoryHash: video.hash,
      },
      reasons: [],
    };
  } catch (error) {
    return {
      state: null,
      reasons: [error instanceof Error ? error.message : String(error)],
    };
  }
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareState(saved, current) {
  const reasons = [];
  if (saved.version !== STATE_VERSION) reasons.push("local media state version changed");
  if (saved.registrySignature !== current.registrySignature) reasons.push("media registry signature changed");
  if (!sameJson(saved.sources, current.sources)) reasons.push("media source fingerprint changed");
  if (!sameJson(saved.config, current.config)) reasons.push("media config/tool signature changed");
  if (saved.responsiveManifestHash !== current.responsiveManifestHash) reasons.push("responsive manifest changed");
  if (saved.videoInventoryHash !== current.videoInventoryHash) reasons.push("video inventory changed");
  return reasons;
}

function resolveOptions(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  return {
    repoRoot,
    assets: options.assets ?? mediaAssets,
    configFiles: options.configFiles ?? DEFAULT_CONFIG_FILES,
    statePath: path.resolve(repoRoot, options.statePath ?? DEFAULT_STATE_PATH),
    responsiveManifestPath: path.resolve(
      repoRoot,
      options.responsiveManifestPath ?? DEFAULT_RESPONSIVE_MANIFEST,
    ),
    videoInventoryPath: path.resolve(
      repoRoot,
      options.videoInventoryPath ?? DEFAULT_VIDEO_INVENTORY,
    ),
  };
}

export function npmCommandForPlatform(platform = process.platform) {
  return platform === "win32" ? "npm.cmd" : "npm";
}

export async function inspectMediaDevState(options = {}) {
  const resolved = resolveOptions(options);
  let savedState;
  try {
    savedState = JSON.parse(await readFile(resolved.statePath, "utf8"));
  } catch (error) {
    const reason = error?.code === "ENOENT"
      ? "local media state is missing"
      : "local media state is corrupted";
    return { fresh: false, reasons: [reason] };
  }

  if (!savedState || typeof savedState !== "object" || Array.isArray(savedState)) {
    return { fresh: false, reasons: ["local media state is corrupted"] };
  }

  const current = await collectCurrentState(resolved);
  if (!current.state) return { fresh: false, reasons: current.reasons };

  const reasons = compareState(savedState, current.state);
  return { fresh: reasons.length === 0, reasons, state: current.state };
}

export async function writeMediaDevState(options = {}) {
  const resolved = resolveOptions(options);
  const current = await collectCurrentState(resolved);
  if (!current.state) {
    throw new Error(`cannot write local media state: ${current.reasons.join("; ")}`);
  }

  await mkdir(path.dirname(resolved.statePath), { recursive: true });
  const contents = `${JSON.stringify(current.state, null, 2)}\n`;
  const temporaryPath = `${resolved.statePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, contents, "utf8");
  await rename(temporaryPath, resolved.statePath);
  return current.state;
}

export async function runNpmMediaSync({ repoRoot = process.cwd() } = {}) {
  const cwd = path.resolve(repoRoot);
  await new Promise((resolve, reject) => {
    const child = spawn(npmCommandForPlatform(), ["run", "media:sync"], {
      cwd,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm run media:sync failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

export async function ensureMediaDevState({ sync, ...options } = {}) {
  const before = await inspectMediaDevState(options);
  if (before.fresh) return before;

  const syncMedia = sync ?? (() => runNpmMediaSync({ repoRoot: options.repoRoot ?? process.cwd() }));
  await syncMedia();

  const after = await inspectMediaDevState(options);
  if (!after.fresh) {
    throw new Error(`media sync completed but local media state is still stale: ${after.reasons.join("; ")}`);
  }
  return after;
}

async function runCli() {
  const mode = process.argv[2];
  if (mode === "--write") {
    await writeMediaDevState();
    console.log("[media-ensure] local media state written");
    return;
  }

  if (mode === "--ensure") {
    const before = await inspectMediaDevState();
    if (before.fresh) {
      console.log("[media-ensure] up to date");
      return;
    }

    console.log(`[media-ensure] stale: ${before.reasons.join("; ")}`);
    await ensureMediaDevState();
    console.log("[media-ensure] synchronized");
    return;
  }

  throw new Error("usage: node tools/media-dev-state.mjs --ensure|--write");
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  await runCli();
}
