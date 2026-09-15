import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { rawGitHubUrl } from "./prepare-cloudflare-pages.mjs";
import { validatePreviewArtifact } from "./validate-candidate-artifact.mjs";

function safeMediaPath(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("private preview media record path must be a non-empty string");
  }
  if (value.includes("\\") || value.startsWith("/") || value.includes("\0")) {
    throw new Error(`unsafe private preview media path: ${value}`);
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || value === "." || value.startsWith("../")) {
    throw new Error(`unsafe private preview media path: ${value}`);
  }
  return value;
}

function requestPathForMedia(relativePath) {
  return `/${relativePath.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
}

async function readPrivateMediaManifest(distDir) {
  try {
    const text = await readFile(path.join(distDir, "preview-media-manifest.json"), "utf8");
    const value = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("private preview media manifest must be an object");
    }
    return value;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function validateTrustedPreviewIdentity(previewMetadata) {
  if (previewMetadata === null || typeof previewMetadata !== "object" || Array.isArray(previewMetadata)) {
    throw new Error("trusted preview metadata is required when a media manifest is present");
  }
  const repository = previewMetadata.repository;
  const sha = previewMetadata.sha;
  if (typeof repository !== "string" || !/^[^/]+\/[^/]+$/u.test(repository)) {
    throw new Error("trusted preview repository is invalid");
  }
  if (typeof sha !== "string" || !/^[0-9a-f]{40}$/iu.test(sha)) {
    throw new Error("trusted preview SHA is invalid");
  }
  return { repository, sha: sha.toLowerCase() };
}

function buildTrustedMediaUpstreams(manifest, previewMetadata) {
  if (!manifest) return {};
  const trusted = validateTrustedPreviewIdentity(previewMetadata);
  if (manifest.repository !== trusted.repository || String(manifest.headSha).toLowerCase() !== trusted.sha) {
    throw new Error("private preview media manifest identity mismatch");
  }
  if (!Array.isArray(manifest.records)) {
    throw new Error("private preview media manifest records must be an array");
  }

  const entries = [];
  const seen = new Set();
  for (const record of manifest.records) {
    if (record === null || typeof record !== "object" || Array.isArray(record)) {
      throw new Error("private preview media manifest contains an invalid record");
    }
    const mediaPath = safeMediaPath(record.path);

    if (record.handling === "preview-only-generated-video-surrogate") {
      continue;
    }
    if (record.handling !== "authenticated-exact-sha-upstream") {
      throw new Error(`unsupported private preview media handling: ${String(record.handling)}`);
    }

    const requestPath = requestPathForMedia(mediaPath);
    if (seen.has(requestPath)) {
      throw new Error(`duplicate private preview media path: ${mediaPath}`);
    }
    seen.add(requestPath);
    entries.push([
      requestPath,
      rawGitHubUrl(trusted.repository, trusted.sha, mediaPath),
    ]);
  }

  entries.sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

async function writeTrustedMediaMap(functionsDir, upstreams) {
  const mapPath = path.join(functionsDir, "_lib", "private-media-map.js");
  await mkdir(path.dirname(mapPath), { recursive: true });
  const serialized = JSON.stringify(upstreams, null, 2);
  await writeFile(
    mapPath,
    `export const PRIVATE_MEDIA_UPSTREAMS = Object.freeze(${serialized});\n`,
    "utf8",
  );
}

export async function assembleTrustedPreviewRuntime({
  distDir,
  workspaceDir,
  trustedRuntimeDir,
  previewMetadata,
} = {}) {
  if (!distDir) throw new Error("distDir is required");
  if (!workspaceDir) throw new Error("workspaceDir is required");
  if (!trustedRuntimeDir) throw new Error("trustedRuntimeDir is required");

  await validatePreviewArtifact({ distDir });
  const mediaManifest = await readPrivateMediaManifest(path.resolve(distDir));
  const trustedMediaUpstreams = buildTrustedMediaUpstreams(mediaManifest, previewMetadata);

  const workspace = path.resolve(workspaceDir);
  const siteDir = path.join(workspace, "site");
  const functionsDir = path.join(workspace, "functions");
  const trustedFunctionsDir = path.resolve(trustedRuntimeDir, "functions");

  await rm(workspace, { recursive: true, force: true });
  await mkdir(workspace, { recursive: true });
  await cp(path.resolve(distDir), siteDir, { recursive: true, force: false, errorOnExist: true });
  await cp(trustedFunctionsDir, functionsDir, { recursive: true, force: false, errorOnExist: true });
  await writeTrustedMediaMap(functionsDir, trustedMediaUpstreams);

  const routes = { version: 1, include: ["/*"], exclude: [] };
  await writeFile(path.join(siteDir, "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

  return { workspaceDir: workspace, siteDir, functionsDir };
}
