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

const STATE_VERSION = 2;
const DEFAULT_STATE_PATH = ".cache/media/dev-state.json";
const DEFAULT_CACHE_MARKER_PATH = ".cache/media/generated-cache.json";
const DEFAULT_RESPONSIVE_MANIFEST = "public/media/generated/responsive-manifest.json";
const DEFAULT_VIDEO_INVENTORY = "public/media/generated/video-inventory.json";
const PACKAGE_LOCK_CONFIG = "package-lock.json";
const SHARP_PACKAGE_PATH = "node_modules/sharp";
const DEFAULT_CONFIG_FILES = [
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "tools/sync-media-catalog.mjs",
  "src/data/media/responsive-policy.ts",
  "src/data/media/assets/index.ts",
  "src/data/media/assets/registered.ts",
  "src/data/media/catalog.ts",
  "src/data/media/catalog-records.generated.ts",
  PACKAGE_LOCK_CONFIG,
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
  const candidate = path.join(repoRoot, "public", clean);
  return await exists(candidate) ? path.resolve(candidate) : null;
}

function hashBytes(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function hashFile(filePath) {
  return hashBytes(await readFile(filePath));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function dependencyNames(record) {
  return [...new Set([
    ...Object.keys(record?.dependencies ?? {}),
    ...Object.keys(record?.optionalDependencies ?? {}),
    ...Object.keys(record?.peerDependencies ?? {}),
  ])].sort((left, right) => left.localeCompare(right));
}

function dependencyCandidatePaths(packagePath, dependencyName) {
  const candidates = [`${packagePath}/node_modules/${dependencyName}`];
  const segments = packagePath.split("/");
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (segments[index] !== "node_modules") continue;
    candidates.push(`${segments.slice(0, index + 1).join("/")}/${dependencyName}`);
  }
  return [...new Set(candidates)];
}

function sharpDependencyLockState(lock) {
  const packages = lock?.packages;
  if (!packages || typeof packages !== "object" || Array.isArray(packages)) {
    throw new Error("media package-lock.json must contain a packages object");
  }

  const root = packages[""] ?? {};
  const sharpSpec = root.devDependencies?.sharp
    ?? root.dependencies?.sharp
    ?? root.optionalDependencies?.sharp
    ?? null;
  if (!sharpSpec || !packages[SHARP_PACKAGE_PATH]) {
    throw new Error("media package-lock.json must contain the direct sharp dependency");
  }

  const selectedPackages = {};
  const unresolvedDependencies = [];
  const queue = [SHARP_PACKAGE_PATH];
  const visited = new Set();

  while (queue.length) {
    const packagePath = queue.shift();
    if (visited.has(packagePath)) continue;
    visited.add(packagePath);

    const record = packages[packagePath];
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      unresolvedDependencies.push({ from: packagePath, name: "<package>" });
      continue;
    }
    selectedPackages[packagePath] = record;

    for (const dependencyName of dependencyNames(record)) {
      const resolvedPath = dependencyCandidatePaths(packagePath, dependencyName)
        .find((candidate) => packages[candidate] && typeof packages[candidate] === "object");
      if (resolvedPath) queue.push(resolvedPath);
      else unresolvedDependencies.push({ from: packagePath, name: dependencyName });
    }
  }

  return {
    lockfileVersion: lock.lockfileVersion ?? null,
    sharpSpec,
    packages: selectedPackages,
    unresolvedDependencies: unresolvedDependencies
      .sort((left, right) => `${left.from}:${left.name}`.localeCompare(`${right.from}:${right.name}`)),
  };
}

async function hashMediaPackageLock(filePath) {
  let lock;
  try {
    lock = JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    throw new Error("media package-lock.json is invalid JSON");
  }
  return hashBytes(stableJson(sharpDependencyLockState(lock)));
}

function registrySignature(assets) {
  const normalized = [...assets]
    .map((asset) => stableValue(asset))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return hashBytes(stableJson(normalized));
}

async function collectSourceFingerprint(repoRoot, assets) {
  const byPath = new Map();

  for (const asset of assets) {
    const sourceSrc = asset.sourceSrc ?? asset.src;
    const sourcePath = await resolveMediaFile(repoRoot, sourceSrc);
    if (!sourcePath) throw new Error(`media source is missing: ${sourceSrc}`);

    const relativePath = normalizeSlashes(path.relative(repoRoot, sourcePath));
    if (byPath.has(relativePath)) continue;
    const fileStat = await stat(sourcePath);
    byPath.set(relativePath, {
      path: relativePath,
      size: fileStat.size,
      hash: await hashFile(sourcePath),
    });
  }

  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

async function collectConfigFingerprint(repoRoot, configFiles) {
  const records = [];
  for (const relativePath of configFiles) {
    const filePath = path.resolve(repoRoot, relativePath);
    if (!(await exists(filePath))) throw new Error(`media config/tool file is missing: ${relativePath}`);
    const normalizedPath = normalizeSlashes(relativePath);
    records.push({
      path: normalizedPath,
      hash: normalizedPath === PACKAGE_LOCK_CONFIG
        ? await hashMediaPackageLock(filePath)
        : await hashFile(filePath),
    });
  }
  return records.sort((left, right) => left.path.localeCompare(right.path));
}

async function readJsonFile(filePath, label) {
  let contents;
  try {
    contents = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return { value: null, hash: null, error: `${label} is missing` };
    throw error;
  }

  try {
    return { value: JSON.parse(contents), hash: hashBytes(contents), error: null };
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
      if (!outputStat) reasons.push(`responsive output is missing: ${variant.src}`);
      else if (Number.isFinite(variant.bytes) && outputStat.size !== variant.bytes) {
        reasons.push(`responsive output byte size changed: ${variant.src}`);
      }
    }
  }

  for (const video of videoInventory?.videos ?? []) {
    if (!video?.outputSrc) continue;
    const outputPath = path.join(repoRoot, "public", normalizePublicSrc(video.outputSrc));
    const outputStat = await stat(outputPath).catch(() => null);
    if (!outputStat) reasons.push(`generated video output is missing: ${video.outputSrc}`);
    else if (Number.isFinite(video.outputBytes) && outputStat.size !== video.outputBytes) {
      reasons.push(`generated video output byte size changed: ${video.outputSrc}`);
    }
  }

  return reasons;
}

function resolveOptions(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  return {
    repoRoot,
    assets: options.assets ?? mediaAssets,
    configFiles: options.configFiles ?? DEFAULT_CONFIG_FILES,
    statePath: path.resolve(repoRoot, options.statePath ?? DEFAULT_STATE_PATH),
    cacheMarkerPath: path.resolve(repoRoot, options.cacheMarkerPath ?? DEFAULT_CACHE_MARKER_PATH),
    responsiveManifestPath: path.resolve(repoRoot, options.responsiveManifestPath ?? DEFAULT_RESPONSIVE_MANIFEST),
    videoInventoryPath: path.resolve(repoRoot, options.videoInventoryPath ?? DEFAULT_VIDEO_INVENTORY),
  };
}

export async function computeMediaInputState(options = {}) {
  const resolved = resolveOptions(options);
  const [sources, config] = await Promise.all([
    collectSourceFingerprint(resolved.repoRoot, resolved.assets),
    collectConfigFingerprint(resolved.repoRoot, resolved.configFiles),
  ]);
  return Object.freeze({
    version: STATE_VERSION,
    registrySignature: registrySignature(resolved.assets),
    sources: Object.freeze(sources),
    config: Object.freeze(config),
  });
}

export async function computeMediaFingerprint(options = {}) {
  return hashBytes(stableJson(await computeMediaInputState(options)));
}

async function collectGeneratedState(resolved) {
  const responsive = await readJsonFile(resolved.responsiveManifestPath, "responsive manifest");
  const video = await readJsonFile(resolved.videoInventoryPath, "video inventory");
  const reasons = [responsive.error, video.error].filter(Boolean);
  if (reasons.length) return { state: null, reasons };

  const outputReasons = await validateGeneratedOutputs(resolved.repoRoot, responsive.value, video.value);
  if (outputReasons.length) return { state: null, reasons: outputReasons };

  return {
    state: {
      responsiveManifestHash: responsive.hash,
      videoInventoryHash: video.hash,
    },
    reasons: [],
  };
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

export async function writeGeneratedMediaCacheMarker(options = {}) {
  const resolved = resolveOptions(options);
  const [input, generated] = await Promise.all([
    computeMediaInputState(options),
    collectGeneratedState(resolved),
  ]);
  if (!generated.state) {
    throw new Error(`cannot mark generated media cache complete: ${generated.reasons.join("; ")}`);
  }
  const marker = Object.freeze({
    version: STATE_VERSION,
    fingerprint: hashBytes(stableJson(input)),
    input,
    ...generated.state,
  });
  await writeJsonAtomic(resolved.cacheMarkerPath, marker);
  return marker;
}

export async function verifyGeneratedMediaCache(options = {}) {
  const resolved = resolveOptions(options);
  let marker;
  try {
    marker = JSON.parse(await readFile(resolved.cacheMarkerPath, "utf8"));
  } catch (error) {
    return {
      valid: false,
      fingerprint: await computeMediaFingerprint(options),
      reasons: [error?.code === "ENOENT" ? "generated-media cache marker is missing" : "generated-media cache marker is invalid"],
    };
  }

  const expectedFingerprint = await computeMediaFingerprint(options);
  const reasons = [];
  if (marker?.version !== STATE_VERSION) reasons.push("generated-media cache marker version changed");
  if (marker?.fingerprint !== expectedFingerprint) reasons.push(`generated-media cache fingerprint mismatch: expected ${expectedFingerprint}, got ${marker?.fingerprint ?? "missing"}`);

  const generated = await collectGeneratedState(resolved);
  reasons.push(...generated.reasons);
  if (generated.state) {
    if (marker?.responsiveManifestHash !== generated.state.responsiveManifestHash) reasons.push("responsive manifest does not match cached generated media");
    if (marker?.videoInventoryHash !== generated.state.videoInventoryHash) reasons.push("video inventory does not match cached generated media");
  }

  return { valid: reasons.length === 0, fingerprint: expectedFingerprint, reasons };
}

export async function inspectMediaDevState(options = {}) {
  const resolved = resolveOptions(options);
  let savedState;
  try {
    savedState = JSON.parse(await readFile(resolved.statePath, "utf8"));
  } catch (error) {
    return { fresh: false, reasons: [error?.code === "ENOENT" ? "local media state is missing" : "local media state is corrupted"] };
  }

  const cache = await verifyGeneratedMediaCache(options);
  if (!cache.valid) return { fresh: false, reasons: cache.reasons };
  if (savedState?.fingerprint !== cache.fingerprint) {
    return { fresh: false, reasons: ["local media state fingerprint changed"] };
  }
  return { fresh: true, reasons: [], state: savedState };
}

export async function writeMediaDevState(options = {}) {
  const resolved = resolveOptions(options);
  const marker = await writeGeneratedMediaCacheMarker(options);
  const state = Object.freeze({ version: STATE_VERSION, fingerprint: marker.fingerprint });
  await writeJsonAtomic(resolved.statePath, state);
  return state;
}

export function resolveNpmMediaSyncCommand({
  platform = process.platform,
  env = process.env,
  execPath = process.execPath,
} = {}) {
  const npmExecPath = typeof env.npm_execpath === "string" ? env.npm_execpath.trim() : "";
  if (npmExecPath) {
    return {
      command: execPath,
      args: [npmExecPath, "run", "media:sync"],
    };
  }

  if (platform === "win32") {
    return {
      command: env.ComSpec || env.COMSPEC || "cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd run media:sync"],
    };
  }

  return {
    command: "npm",
    args: ["run", "media:sync"],
  };
}

export async function runNpmMediaSync({ repoRoot = process.cwd() } = {}) {
  const cwd = path.resolve(repoRoot);
  const invocation = resolveNpmMediaSyncCommand();
  await new Promise((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run media:sync failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

export async function ensureMediaDevState({ sync, ...options } = {}) {
  const before = await inspectMediaDevState(options);
  if (before.fresh) return before;

  const syncMedia = sync ?? (() => runNpmMediaSync({ repoRoot: options.repoRoot ?? process.cwd() }));
  await syncMedia();

  const after = await inspectMediaDevState(options);
  if (!after.fresh) throw new Error(`media sync completed but local media state is still stale: ${after.reasons.join("; ")}`);
  return after;
}

async function runCli() {
  const mode = process.argv[2];
  if (mode === "--fingerprint") {
    console.log(await computeMediaFingerprint());
    return;
  }
  if (mode === "--cache-write") {
    const marker = await writeGeneratedMediaCacheMarker();
    console.log(`[media-cache] ${marker.fingerprint}`);
    return;
  }
  if (mode === "--cache-verify") {
    const result = await verifyGeneratedMediaCache();
    if (!result.valid) throw new Error(`required generated-media cache for fingerprint ${result.fingerprint} is invalid: ${result.reasons.join("; ")}`);
    console.log(`[media-cache] verified ${result.fingerprint}`);
    return;
  }
  if (mode === "--write") {
    const state = await writeMediaDevState();
    console.log(`[media-ensure] local media state written ${state.fingerprint}`);
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
  throw new Error("usage: node tools/media-dev-state.mjs --fingerprint|--cache-write|--cache-verify|--ensure|--write");
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) await runCli();
