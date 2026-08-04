#!/usr/bin/env node

import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v"]);
const IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png", ".avif"]);
const CRF = 18;
const PRESET = "slow";
const MIN_SSIM = 0.995;
const MIN_SAVING_RATIO = 0.03;
const DEFAULT_WINDOWS_ROOT =
  "A:\\Users\\awful\\Documents\\CODE\\looksawful.ru";

function parseArgs(argv) {
  const options = {
    root: "",
    prepare: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--root") {
      options.root = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--skip-prepare") {
      options.prepare = false;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function exists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function findProjectRoot(explicitRoot) {
  const candidates = [];

  if (explicitRoot) {
    candidates.push(path.resolve(explicitRoot));
  }

  if (process.env.MEDIA_PROJECT_ROOT) {
    candidates.push(path.resolve(process.env.MEDIA_PROJECT_ROOT));
  }

  if (process.platform === "win32") {
    candidates.push(DEFAULT_WINDOWS_ROOT);
  }

  let current = process.cwd();

  while (true) {
    candidates.push(current);
    const parent = path.dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  for (const candidate of [...new Set(candidates)]) {
    if (
      (await exists(path.join(candidate, "package.json"))) &&
      (await exists(path.join(candidate, "media", "projects")))
    ) {
      return candidate;
    }
  }

  throw new Error(
    "Project root not found. Pass it explicitly: --root \"A:\\Users\\awful\\Documents\\CODE\\looksawful.ru\"",
  );
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      windowsHide: true,
      stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    if (!options.inherit) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
    }

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const message = [
        `Command failed (${code}): ${command}`,
        stderr.trim(),
        stdout.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      reject(new Error(message));
    });
  });
}

async function resolveExecutable(name, windowsFallback) {
  const candidates = [name];

  if (process.platform === "win32" && windowsFallback) {
    candidates.unshift(windowsFallback);
  }

  for (const candidate of candidates) {
    try {
      await run(candidate, ["-version"]);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(`${name} not found.`);
}

async function walkFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function firstVideoStream(probe) {
  return probe.streams.find((stream) => stream.codec_type === "video") ?? null;
}

function audioStreams(probe) {
  return probe.streams.filter((stream) => stream.codec_type === "audio");
}

async function probeMedia(ffprobe, filePath) {
  const { stdout } = await run(ffprobe, [
    "-v",
    "error",
    "-show_entries",
    [
      "format=duration,size,format_name",
      "stream=index,codec_type,codec_name,profile,width,height,pix_fmt,avg_frame_rate,r_frame_rate,sample_rate,channels,channel_layout,color_space,color_transfer,color_primaries,color_range",
    ].join(":"),
    "-of",
    "json",
    filePath,
  ]);

  return JSON.parse(stdout);
}

function frameRate(stream) {
  const raw = stream?.avg_frame_rate || stream?.r_frame_rate || "0/0";
  const [numerator, denominator] = raw.split("/").map(Number);

  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function durationSeconds(probe) {
  const value = Number(probe.format?.duration);
  return Number.isFinite(value) ? value : 0;
}

function buildColorArguments(stream) {
  const args = [];
  const mappings = [
    ["-color_primaries", stream?.color_primaries],
    ["-color_trc", stream?.color_transfer],
    ["-colorspace", stream?.color_space],
    ["-color_range", stream?.color_range],
  ];

  for (const [flag, value] of mappings) {
    if (value && value !== "unknown" && value !== "unspecified") {
      args.push(flag, value);
    }
  }

  return args;
}

async function audioPayloadHash(ffmpeg, filePath, hasAudio) {
  if (!hasAudio) {
    return "";
  }

  const { stdout } = await run(ffmpeg, [
    "-v",
    "error",
    "-i",
    filePath,
    "-map",
    "0:a",
    "-c:a",
    "copy",
    "-f",
    "hash",
    "-hash",
    "sha256",
    "-",
  ]);

  const match = stdout.match(/SHA256=([a-f0-9]+)/i);
  return match?.[1]?.toLowerCase() ?? "";
}

async function calculateSsim(ffmpeg, originalPath, candidatePath) {
  const { stderr } = await run(ffmpeg, [
    "-hide_banner",
    "-i",
    originalPath,
    "-i",
    candidatePath,
    "-lavfi",
    "[0:v:0][1:v:0]ssim",
    "-an",
    "-f",
    "null",
    "-",
  ]);

  const matches = [...stderr.matchAll(/All:([0-9.]+)/g)];

  if (matches.length === 0) {
    throw new Error("SSIM result not found.");
  }

  return Number(matches.at(-1)[1]);
}

function sameAudioLayout(before, after) {
  const beforeAudio = audioStreams(before);
  const afterAudio = audioStreams(after);

  if (beforeAudio.length !== afterAudio.length) {
    return false;
  }

  return beforeAudio.every((stream, index) => {
    const next = afterAudio[index];

    return (
      stream.codec_name === next.codec_name &&
      String(stream.sample_rate ?? "") === String(next.sample_rate ?? "") &&
      Number(stream.channels ?? 0) === Number(next.channels ?? 0) &&
      String(stream.channel_layout ?? "") === String(next.channel_layout ?? "")
    );
  });
}

function validateCandidate(before, after) {
  const beforeVideo = firstVideoStream(before);
  const afterVideo = firstVideoStream(after);

  if (!beforeVideo || !afterVideo) {
    throw new Error("Video stream is missing.");
  }

  if (
    Number(beforeVideo.width) !== Number(afterVideo.width) ||
    Number(beforeVideo.height) !== Number(afterVideo.height)
  ) {
    throw new Error("Resolution changed.");
  }

  const beforeDuration = durationSeconds(before);
  const afterDuration = durationSeconds(after);
  const durationTolerance = Math.max(0.12, beforeDuration * 0.001);

  if (Math.abs(beforeDuration - afterDuration) > durationTolerance) {
    throw new Error(
      `Duration changed: ${beforeDuration.toFixed(3)} -> ${afterDuration.toFixed(3)}.`,
    );
  }

  if (!sameAudioLayout(before, after)) {
    throw new Error("Audio stream layout changed.");
  }
}

async function encodeCandidate(ffmpeg, inputPath, outputPath, probe) {
  const video = firstVideoStream(probe);

  if (!video) {
    throw new Error("No video stream.");
  }

  const args = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-stats",
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-map",
    "0:s?",
    "-map_metadata",
    "0",
    "-map_chapters",
    "0",
    "-c:v",
    "libx264",
    "-preset",
    PRESET,
    "-crf",
    String(CRF),
    "-pix_fmt",
    "yuv420p",
    "-fps_mode",
    "passthrough",
    ...buildColorArguments(video),
    "-c:a",
    "copy",
    "-c:s",
    "copy",
    "-movflags",
    "+faststart",
    outputPath,
  ];

  await run(ffmpeg, args, { inherit: true });
}

async function replaceWithBackup({
  projectRoot,
  sourceRoot,
  backupRoot,
  inputPath,
  candidatePath,
}) {
  const relativePath = path.relative(sourceRoot, inputPath);
  const backupPath = path.join(backupRoot, relativePath);

  await mkdir(path.dirname(backupPath), { recursive: true });
  await rename(inputPath, backupPath);

  try {
    await rename(candidatePath, inputPath);
  } catch (error) {
    await rename(backupPath, inputPath);
    throw error;
  }

  return path.relative(projectRoot, backupPath);
}

async function runMediaPrepare(projectRoot) {
  const packagePath = path.join(projectRoot, "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));

  if (!packageJson.scripts?.["media:prepare"]) {
    console.log("\nmedia:prepare is not configured; generated variants were not rebuilt.");
    return;
  }

  console.log("\nRebuilding generated media variants...");
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  await run(npmCommand, ["run", "media:prepare"], {
    cwd: projectRoot,
    inherit: true,
  });
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = await findProjectRoot(options.root);
  const sourceRoot = path.join(projectRoot, "media", "projects");
  const backupRoot = path.join(
    projectRoot,
    "media",
    ".compression-backup",
    timestamp(),
  );

  const ffmpeg = await resolveExecutable(
    "ffmpeg",
    "C:\\FFmpeg_exe\\ffmpeg.exe",
  );
  const ffprobe = await resolveExecutable(
    "ffprobe",
    "C:\\FFmpeg_exe\\ffprobe.exe",
  );

  const files = await walkFiles(sourceRoot);
  const videos = files.filter((filePath) =>
    VIDEO_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );
  const images = files.filter((filePath) =>
    IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );

  console.log(`Project: ${projectRoot}`);
  console.log(`Canonical images: ${images.length}`);
  console.log(`Canonical videos: ${videos.length}`);
  console.log(
    "Images are not re-encoded: the audit shows they are already compact WebP sources.",
  );
  console.log(
    `Video mode: H.264 CRF ${CRF}, preset ${PRESET}, original resolution/timing, bit-exact audio copy.`,
  );

  let originalBytes = 0;
  let finalBytes = 0;
  let replaced = 0;
  let skipped = 0;
  const failures = [];

  for (let index = 0; index < videos.length; index += 1) {
    const inputPath = videos[index];
    const relativePath = path.relative(projectRoot, inputPath);
    const candidatePath = `${inputPath}.compressing-${process.pid}.mp4`;

    console.log(`\n[${index + 1}/${videos.length}] ${relativePath}`);

    try {
      const beforeStat = await stat(inputPath);
      const beforeProbe = await probeMedia(ffprobe, inputPath);
      const beforeVideo = firstVideoStream(beforeProbe);
      const beforeAudio = audioStreams(beforeProbe);
      const beforeAudioHash = await audioPayloadHash(
        ffmpeg,
        inputPath,
        beforeAudio.length > 0,
      );

      originalBytes += beforeStat.size;

      console.log(
        [
          `${beforeVideo.width}x${beforeVideo.height}`,
          `${frameRate(beforeVideo).toFixed(3)} fps`,
          `${durationSeconds(beforeProbe).toFixed(2)} s`,
          `${(beforeStat.size / 1024 / 1024).toFixed(2)} MB`,
          `${beforeAudio.length} audio stream(s)`,
        ].join(" | "),
      );

      await encodeCandidate(ffmpeg, inputPath, candidatePath, beforeProbe);

      const candidateStat = await stat(candidatePath);
      const afterProbe = await probeMedia(ffprobe, candidatePath);
      validateCandidate(beforeProbe, afterProbe);

      const afterAudioHash = await audioPayloadHash(
        ffmpeg,
        candidatePath,
        beforeAudio.length > 0,
      );

      if (beforeAudioHash !== afterAudioHash) {
        throw new Error("Audio payload hash changed.");
      }

      const ssim = await calculateSsim(ffmpeg, inputPath, candidatePath);
      const savingRatio = 1 - candidateStat.size / beforeStat.size;

      console.log(
        `Candidate: ${(candidateStat.size / 1024 / 1024).toFixed(2)} MB | saving ${(savingRatio * 100).toFixed(1)}% | SSIM ${ssim.toFixed(6)}`,
      );

      if (ssim < MIN_SSIM) {
        console.log(`SKIP: SSIM is below ${MIN_SSIM}.`);
        await rm(candidatePath, { force: true });
        finalBytes += beforeStat.size;
        skipped += 1;
        continue;
      }

      if (savingRatio < MIN_SAVING_RATIO) {
        console.log(
          `SKIP: saving is below ${(MIN_SAVING_RATIO * 100).toFixed(0)}%.`,
        );
        await rm(candidatePath, { force: true });
        finalBytes += beforeStat.size;
        skipped += 1;
        continue;
      }

      const backupPath = await replaceWithBackup({
        projectRoot,
        sourceRoot,
        backupRoot,
        inputPath,
        candidatePath,
      });

      console.log(`REPLACED | backup: ${backupPath}`);
      finalBytes += candidateStat.size;
      replaced += 1;
    } catch (error) {
      await rm(candidatePath, { force: true }).catch(() => {});
      failures.push({
        path: relativePath,
        message: error instanceof Error ? error.message : String(error),
      });

      try {
        const currentStat = await stat(inputPath);
        finalBytes += currentStat.size;
      } catch {
        // The original replacement function restores the source after a failed rename.
      }

      console.error(`ERROR: ${failures.at(-1).message}`);
    }
  }

  if (replaced === 0) {
    await rm(backupRoot, { recursive: true, force: true });
  }

  const savedBytes = originalBytes - finalBytes;

  console.log("\nSummary");
  console.log(`Replaced: ${replaced}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failures.length}`);
  console.log(`Before: ${(originalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`After: ${(finalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);

  if (replaced > 0) {
    console.log(`Backup: ${backupRoot}`);
  }

  if (failures.length > 0) {
    console.log("\nFailed files:");

    for (const failure of failures) {
      console.log(`- ${failure.path}: ${failure.message}`);
    }

    process.exitCode = 1;
    return;
  }

  if (options.prepare && replaced > 0) {
    await runMediaPrepare(projectRoot);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
