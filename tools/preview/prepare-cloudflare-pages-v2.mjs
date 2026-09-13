import { spawnSync } from "node:child_process";
import { stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  CLOUDFLARE_PAGES_MAX_ASSET_BYTES,
  findOversizedFiles,
  rawGitHubUrl,
  transcodeGeneratedPreviewVideo,
} from "./prepare-cloudflare-pages.mjs";

function defaultIsTracked(repoRelativePath) {
  const result = spawnSync("git", ["ls-files", "--error-unmatch", "--", repoRelativePath], {
    stdio: "ignore",
  });
  return result.status === 0;
}

export async function preparePrivateCloudflarePagesPreview({
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
  const records = [];

  for (const asset of oversized) {
    const repoRelativePath = `public/${asset.relativePath}`;

    if (isTracked(repoRelativePath)) {
      const upstream = rawGitHubUrl(repository, headSha, asset.relativePath);
      await unlink(asset.absolutePath);
      records.push({
        path: asset.relativePath,
        originalBytes: asset.bytes,
        handling: "authenticated-exact-sha-upstream",
        upstream,
      });
      continue;
    }

    if (/^media\/generated\/video\/.+\.(?:mp4|webm)$/i.test(asset.relativePath)) {
      const previewBytes = await transcodeGeneratedVideo(asset.absolutePath, { limitBytes });
      records.push({
        path: asset.relativePath,
        originalBytes: asset.bytes,
        previewBytes,
        handling: "preview-only-generated-video-surrogate",
      });
      continue;
    }

    throw new Error(
      `unsupported oversized private preview asset: ${asset.relativePath} (${asset.bytes} bytes). `
      + "The candidate copy was preserved. Add an explicit authenticated preview strategy before deployment.",
    );
  }

  const remaining = await findOversizedFiles(distDir, limitBytes);
  if (remaining.length) {
    throw new Error(
      `private preview packaging left oversized assets: ${remaining.map((item) => item.relativePath).join(", ")}`,
    );
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
  const headSha = process.env.PR_HEAD_SHA?.trim() ?? process.env.TARGET_SHA?.trim() ?? process.env.GITHUB_SHA?.trim() ?? "";
  const distDir = path.resolve(process.argv[2] ?? "dist");
  const manifest = await preparePrivateCloudflarePagesPreview({ distDir, repository, headSha });

  for (const record of manifest.records) {
    const size = record.previewBytes ? ` -> ${record.previewBytes}` : "";
    console.log(`[preview-v2-media] ${record.handling}: ${record.path} ${record.originalBytes}${size}`);
  }
  console.log(`[preview-v2-media] prepared ${manifest.records.length} oversized assets behind the private origin`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
