import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
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

const OUTPUT_PREFIX = "/media/generated/video";
const INVENTORY_PATH = "public/media/generated/video-inventory.json";
const VIDEO_CONFIG = Object.freeze({
  version: 1,
  videoCodec: "libx264",
  preset: "slow",
  crf: 20,
  pixelFormat: "yuv420p",
  movflags: "+faststart",
  audioCodec: "aac",
  audioBitrate: "192k",
  maxWidth: 2560,
  maxBitrate: 16_000_000,
});

function normalizePublicSrc(src) {
  return String(src).split(/[?#]/, 1)[0].replace(/\\/g, "/").replace(/^\.?\//, "");
}

function extensionFor(src) {
  return path.extname(normalizePublicSrc(src)).slice(1).toLowerCase();
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
    path.join(repoRoot, "public", clean),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }

  return null;
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

function videoConfigHash() {
  return createHash("sha256").update(JSON.stringify(VIDEO_CONFIG)).digest("hex");
}

async function readInventory(inventoryPath) {
  if (!(await exists(inventoryPath))) return null;
  try {
    return JSON.parse(await readFile(inventoryPath, "utf8"));
  } catch {
    return null;
  }
}

async function writeInventory(inventoryPath, inventory) {
  const contents = `${JSON.stringify(inventory, null, 2)}\n`;
  const previousContents = await readFile(inventoryPath, "utf8").catch(() => null);

  if (previousContents === contents) {
    return false;
  }

  await mkdir(path.dirname(inventoryPath), { recursive: true });
  const tmpPath = `${inventoryPath}.tmp`;
  await writeFile(tmpPath, contents, "utf8");
  await rename(tmpPath, inventoryPath);
  return true;
}

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

export function plannedVideoOutputSrc(src) {
  const clean = normalizePublicSrc(src).replace(/^media\//, "");
  const parsed = path.posix.parse(clean);
  const dir = parsed.dir ? `${parsed.dir}/` : "";
  return `${OUTPUT_PREFIX}/${dir}${parsed.name}.web.mp4`;
}

export function canReuseVideoOutput({
  previousItem,
  sourceHash,
  configHash,
  outputSrc,
  outputBytes,
}) {
  return Boolean(
    previousItem
      && previousItem.sourceHash === sourceHash
      && previousItem.configHash === configHash
      && previousItem.outputSrc === outputSrc
      && Number.isFinite(outputBytes)
      && previousItem.outputBytes === outputBytes,
  );
}

function rateToNumber(rate) {
  if (!rate || typeof rate !== "string") return null;
  const [numerator, denominator] = rate.split("/").map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

export function classifyVideoProbe({ path: videoPath, probe }) {
  const ext = extensionFor(videoPath);
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const audio = probe.streams?.find((stream) => stream.codec_type === "audio");
  const bitrate = Number(probe.format?.bit_rate);
  const reasons = [];

  if (ext === "mov") reasons.push("mov container should be replaced with web mp4");
  if (!video) reasons.push("missing video stream");
  if (video && video.codec_name !== "h264") reasons.push(`codec ${video.codec_name} is not h264`);
  if (video && video.pix_fmt !== VIDEO_CONFIG.pixelFormat) reasons.push(`pixel format ${video.pix_fmt} is not ${VIDEO_CONFIG.pixelFormat}`);
  if (video && Number(video.width) > VIDEO_CONFIG.maxWidth) reasons.push(`width ${video.width} is oversized for current web policy`);
  if (Number.isFinite(bitrate) && bitrate > VIDEO_CONFIG.maxBitrate) reasons.push(`bitrate ${bitrate} is high for web delivery`);
  if (probe.faststart === false && ext === "mp4") reasons.push("mp4 moov atom is not faststart");

  return {
    status: reasons.length ? "transcode" : "unchanged",
    reasons,
    container: probe.format?.format_name ?? "",
    codec: video?.codec_name ?? "",
    profile: video?.profile ?? "",
    width: video?.width ?? null,
    height: video?.height ?? null,
    fps: rateToNumber(video?.r_frame_rate) ?? null,
    duration: Number(probe.format?.duration) || null,
    bitrate: Number.isFinite(bitrate) ? bitrate : null,
    pixelFormat: video?.pix_fmt ?? "",
    audioCodec: audio?.codec_name ?? "",
    audioChannels: audio?.channels ?? null,
    size: Number(probe.format?.size) || null,
    rotation: video?.tags?.rotate ?? video?.side_data_list?.find((item) => item.rotation)?.rotation ?? null,
  };
}

async function hasFaststart(filePath) {
  const head = await new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    const stream = createReadStream(filePath, { start: 0, end: 2_000_000 });
    stream.on("data", (chunk) => {
      chunks.push(chunk);
      length += chunk.length;
      if (length > 2_000_000) stream.destroy();
    });
    stream.on("error", reject);
    stream.on("close", () => resolve(Buffer.concat(chunks)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
  const moov = head.indexOf(Buffer.from("moov"));
  const mdat = head.indexOf(Buffer.from("mdat"));
  if (moov < 0 || mdat < 0) return null;
  return moov < mdat;
}

async function ffprobe(filePath) {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  const probe = JSON.parse(stdout);
  probe.faststart = await hasFaststart(filePath);
  return probe;
}

async function transcode({ inputPath, outputPath, analysis }) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const args = [
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-dn",
    "-map_metadata",
    "-1",
    "-map_chapters",
    "-1",
    "-c:v",
    VIDEO_CONFIG.videoCodec,
    "-preset",
    VIDEO_CONFIG.preset,
    "-crf",
    String(VIDEO_CONFIG.crf),
    "-pix_fmt",
    VIDEO_CONFIG.pixelFormat,
    "-movflags",
    VIDEO_CONFIG.movflags,
    "-write_tmcd",
    "0",
  ];

  if (analysis.audioCodec) {
    args.push("-c:a", VIDEO_CONFIG.audioCodec, "-b:a", VIDEO_CONFIG.audioBitrate);
  } else {
    args.push("-an");
  }

  args.push(outputPath);
  await run("ffmpeg", args);
}

export async function analyzeVideoMedia({
  repoRoot = process.cwd(),
  assets = mediaAssets,
  build = false,
  inventoryPath = path.join(repoRoot, INVENTORY_PATH),
} = {}) {
  const root = path.resolve(repoRoot);
  const videos = assets.filter((asset) => asset.type === "video");
  const previousInventory = await readInventory(inventoryPath);
  const buildConfigHash = videoConfigHash();
  const items = [];
  let generatedCount = 0;
  let skippedCount = 0;

  for (const asset of videos) {
    const sourceSrc = asset.sourceSrc ?? asset.src;
    const filePath = await resolveMediaFile(root, sourceSrc);

    if (!filePath) {
      items.push({
        id: asset.id,
        src: asset.src,
        sourceSrc,
        status: "missing",
        reasons: ["source file does not exist"],
      });
      continue;
    }

    const fileStat = await stat(filePath);
    const sourceHash = await hashFile(filePath);
    const probe = await ffprobe(filePath);
    const analysis = classifyVideoProbe({ path: sourceSrc, probe });
    const outputSrc = analysis.status === "transcode"
      ? (asset.sourceSrc ? asset.src : plannedVideoOutputSrc(sourceSrc))
      : null;
    const outputPath = outputSrc
      ? path.join(root, "public", normalizePublicSrc(outputSrc))
      : null;
    let outputStat = outputPath ? await stat(outputPath).catch(() => null) : null;
    const previousItem = previousInventory?.videos?.find((item) => item.id === asset.id);
    const reusable = outputSrc && canReuseVideoOutput({
      previousItem,
      sourceHash,
      configHash: buildConfigHash,
      outputSrc,
      outputBytes: outputStat?.size,
    });

    if (build && analysis.status === "transcode" && outputPath) {
      if (reusable) {
        skippedCount += 1;
      } else {
        await transcode({ inputPath: filePath, outputPath, analysis });
        outputStat = await stat(outputPath);
        generatedCount += 1;
      }
    }

    items.push({
      id: asset.id,
      src: asset.src,
      sourceSrc,
      sourceBytes: fileStat.size,
      sourceHash,
      configHash: buildConfigHash,
      outputSrc,
      outputBytes: outputStat?.size ?? null,
      ...analysis,
    });
  }

  const persistedInventory = {
    version: VIDEO_CONFIG.version,
    configHash: buildConfigHash,
    videos: items,
  };
  const inventoryChanged = await writeInventory(inventoryPath, persistedInventory);

  return {
    ...persistedInventory,
    generatedCount,
    skippedCount,
    inventoryChanged,
  };
}

async function runCli() {
  const build = process.argv.includes("--build");
  const inventory = await analyzeVideoMedia({ build });
  const transcodeCount = inventory.videos.filter((video) => video.status === "transcode").length;
  const missingCount = inventory.videos.filter((video) => video.status === "missing").length;
  console.log(
    `[video-media] ${inventory.videos.length} videos, ${transcodeCount} transcode candidates, ${inventory.generatedCount} generated, ${inventory.skippedCount} unchanged, ${missingCount} missing`,
  );
  console.log(`[video-media] inventory: ${INVENTORY_PATH}`);

  if (missingCount) process.exitCode = 1;
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectRun) {
  await runCli();
}
