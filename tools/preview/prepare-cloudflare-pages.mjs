import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const CLOUDFLARE_PAGES_MAX_ASSET_BYTES = 25 * 1024 * 1024;
const PREVIEW_VIDEO_TARGET_BYTES = 20 * 1024 * 1024;
const GENERATED_MARKER = "# BEGIN LOOKSAWFUL PREVIEW OVERSIZED ASSETS";
const GENERATED_END_MARKER = "# END LOOKSAWFUL PREVIEW OVERSIZED ASSETS";

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function encodePathSegments(value) {
  return value.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

export function rawGitHubUrl(repository, sha, publicRelativePath) {
  if (!/^[^/]+\/[^/]+$/.test(repository)) throw new Error(`invalid GitHub repository: ${repository}`);
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error(`invalid Git SHA: ${sha}`);
  const clean = publicRelativePath.replace(/^\/+/, "");
  return `https://raw.githubusercontent.com/${repository}/${sha}/public/${encodePathSegments(clean)}`;
}

export function redirectLine(publicRelativePath, destination) {
  return `/${publicRelativePath.replace(/^\/+/, "")} ${destination} 302`;
}

async function walkFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(root, absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

export async function findOversizedFiles(distDir, limitBytes = CLOUDFLARE_PAGES_MAX_ASSET_BYTES) {
  const files = await walkFiles(distDir);
  const oversized = [];
  for (const absolutePath of files) {
    const info = await stat(absolutePath);
    if (info.size <= limitBytes) continue;
    oversized.push({
      absolutePath,
      relativePath: toPosix(path.relative(distDir, absolutePath)),
      bytes: info.size,
    });
  }
  return oversized.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function defaultIsTracked(repoRelativePath) {
  const result = spawnSync("git", ["ls-files", "--error-unmatch", "--", repoRelativePath], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function commandExists(command) {
  const check = process.platform === "win32" ? "where" : "sh";
  const args = process.platform === "win32" ? [command] : ["-c", `command -v ${command}`];
  return spawnSync(check, args, { stdio: "ignore" }).status === 0;
}

function probeDurationSeconds(filePath) {
  const output = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath],
    { encoding: "utf8" },
  ).trim();
  const duration = Number(output);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`could not determine preview video duration: ${filePath}`);
  }
  return duration;
}

function runFfmpeg(args, label) {
  const result = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
}

export async function transcodeGeneratedPreviewVideo(filePath, {
  limitBytes = CLOUDFLARE_PAGES_MAX_ASSET_BYTES,
  targetBytes = PREVIEW_VIDEO_TARGET_BYTES,
} = {}) {
  if (!commandExists("ffmpeg") || !commandExists("ffprobe")) {
    throw new Error("ffmpeg and ffprobe are required to create an oversized generated preview-video surrogate");
  }

  const duration = probeDurationSeconds(filePath);
  const effectiveTarget = Math.min(targetBytes, Math.floor(limitBytes * 0.8));
  const totalBitsPerSecond = Math.floor((effectiveTarget * 8 * 0.96) / duration);
  const audioBitsPerSecond = 96_000;
  const videoBitsPerSecond = Math.max(250_000, totalBitsPerSecond - audioBitsPerSecond);
  const tempPath = `${filePath}.preview.mp4`;
  const passLog = `${filePath}.preview-pass`;
  const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";

  await mkdir(path.dirname(filePath), { recursive: true });
  await rm(tempPath, { force: true });

  const common = [
    "-y",
    "-i", filePath,
    "-map", "0:v:0",
    "-c:v", "libx264",
    "-preset", "medium",
    "-pix_fmt", "yuv420p",
    "-b:v", String(videoBitsPerSecond),
    "-maxrate", String(videoBitsPerSecond),
    "-bufsize", String(videoBitsPerSecond * 2),
  ];

  try {
    runFfmpeg([
      ...common,
      "-pass", "1",
      "-passlogfile", passLog,
      "-an",
      "-f", "mp4",
      nullDevice,
    ], "preview video first pass");

    runFfmpeg([
      ...common,
      "-pass", "2",
      "-passlogfile", passLog,
      "-map", "0:a?",
      "-c:a", "aac",
      "-b:a", String(audioBitsPerSecond),
      "-movflags", "+faststart",
      tempPath,
    ], "preview video second pass");

    const outputInfo = await stat(tempPath);
    if (outputInfo.size > limitBytes) {
      throw new Error(`preview surrogate still exceeds Cloudflare Pages limit: ${outputInfo.size} bytes (${filePath})`);
    }

    await rename(tempPath, filePath);
    return outputInfo.size;
  } finally {
    await rm(tempPath, { force: true });
    await rm(`${passLog}-0.log`, { force: true });
    await rm(`${passLog}-0.log.mbtree`, { force: true });
  }
}

function stripGeneratedRedirectBlock(text) {
  const start = text.indexOf(GENERATED_MARKER);
  if (start < 0) return text.trimEnd();
  const end = text.indexOf(GENERATED_END_MARKER, start);
  if (end < 0) throw new Error("dist/_redirects contains an unterminated looksawful preview redirect block");
  return `${text.slice(0, start)}${text.slice(end + GENERATED_END_MARKER.length)}`.trim();
}

async function writeRedirects(distDir, lines) {
  if (!lines.length) return;
  const redirectsPath = path.join(distDir, "_redirects");
  let existing = "";
  try {
    existing = await readFile(redirectsPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const preserved = stripGeneratedRedirectBlock(existing);
  const generated = [GENERATED_MARKER, ...lines, GENERATED_END_MARKER].join("\n");
  const finalText = preserved ? `${generated}\n${preserved}\n` : `${generated}\n`;
  await writeFile(redirectsPath, finalText, "utf8");
}

export async function prepareCloudflarePagesPreview({
  distDir,
  repository,
  headSha,
  limitBytes = CLOUDFLARE_PAGES_MAX_ASSET_BYTES,
  isTracked = defaultIsTracked,
  transcodeGeneratedVideo = transcodeGeneratedPreviewVideo,
} = {}) {
  if (!distDir) throw new Error("distDir is required");
  if (!repository) throw new Error("repository is required");
  if (!headSha) throw new Error("headSha is required");

  const oversized = await findOversizedFiles(distDir, limitBytes);
  const redirects = [];
  const records = [];

  for (const asset of oversized) {
    const repoRelativePath = `public/${asset.relativePath}`;
    if (isTracked(repoRelativePath)) {
      const destination = rawGitHubUrl(repository, headSha, asset.relativePath);
      await unlink(asset.absolutePath);
      redirects.push(redirectLine(asset.relativePath, destination));
      records.push({
        path: asset.relativePath,
        originalBytes: asset.bytes,
        handling: "exact-sha-github-raw-redirect",
        destination,
      });
      continue;
    }

    if (/^media\/generated\/video\/.+\.(?:mp4|webm)$/i.test(asset.relativePath)) {
      const surrogateBytes = await transcodeGeneratedVideo(asset.absolutePath, { limitBytes });
      records.push({
        path: asset.relativePath,
        originalBytes: asset.bytes,
        previewBytes: surrogateBytes,
        handling: "preview-only-generated-video-surrogate",
      });
      continue;
    }

    throw new Error(
      `unsupported oversized preview asset: ${asset.relativePath} (${asset.bytes} bytes). `
      + "The source repository file was not deleted. Add an explicit safe preview strategy before deployment.",
    );
  }

  await writeRedirects(distDir, redirects);

  const remaining = await findOversizedFiles(distDir, limitBytes);
  if (remaining.length) {
    throw new Error(`Cloudflare preview packaging left oversized assets: ${remaining.map((item) => item.relativePath).join(", ")}`);
  }

  const manifest = {
    repository,
    headSha,
    limitBytes,
    records,
  };
  await writeFile(
    path.join(distDir, "preview-media-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return manifest;
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY?.trim() ?? "";
  const headSha = process.env.PR_HEAD_SHA?.trim() ?? process.env.GITHUB_SHA?.trim() ?? "";
  const distDir = path.resolve(process.argv[2] ?? "dist");
  const manifest = await prepareCloudflarePagesPreview({ distDir, repository, headSha });
  for (const record of manifest.records) {
    const size = record.previewBytes ? ` -> ${record.previewBytes}` : "";
    console.log(`[preview-media] ${record.handling}: ${record.path} ${record.originalBytes}${size}`);
  }
  console.log(`[preview-media] prepared ${manifest.records.length} oversized assets without deleting repository sources`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
