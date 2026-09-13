import { lstat, readdir } from "node:fs/promises";
import path from "node:path";

const FORBIDDEN_ROOT_FILES = new Set(["_worker.js", "_routes.json"]);
const FORBIDDEN_ROOT_DIRECTORIES = new Set(["functions"]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function assertSafeRelativePath(relativePath) {
  const normalized = toPosix(relativePath);
  const [firstSegment] = normalized.split("/");

  if (FORBIDDEN_ROOT_FILES.has(normalized)) {
    throw new Error(`candidate artifact contains forbidden runtime file: ${normalized}`);
  }
  if (FORBIDDEN_ROOT_DIRECTORIES.has(firstSegment)) {
    throw new Error(`candidate artifact contains forbidden runtime path: ${normalized}`);
  }
}

async function walk(root, current, records) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    const relativePath = path.relative(root, absolutePath);
    assertSafeRelativePath(relativePath);

    const info = await lstat(absolutePath);
    if (info.isSymbolicLink()) {
      throw new Error(`candidate artifact contains symlink: ${toPosix(relativePath)}`);
    }
    if (info.isDirectory()) {
      await walk(root, absolutePath, records);
      continue;
    }
    if (!info.isFile()) {
      throw new Error(`candidate artifact contains unsupported special file: ${toPosix(relativePath)}`);
    }

    records.push({
      path: toPosix(relativePath),
      bytes: info.size,
    });
  }
}

export async function validatePreviewArtifact({ distDir } = {}) {
  if (!distDir) throw new Error("distDir is required");

  const root = path.resolve(distDir);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    throw new Error(`candidate artifact root must be a real directory: ${root}`);
  }

  const records = [];
  await walk(root, root, records);
  return {
    distDir: root,
    files: records.sort((a, b) => a.path.localeCompare(b.path)),
  };
}
