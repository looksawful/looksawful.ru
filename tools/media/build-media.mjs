#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, [
  path.resolve(root, "tools/media/prepare-media.mjs"),
  "--root",
  root,
]);

run(process.execPath, [
  path.resolve(root, "tools/media/verify-media-system.mjs"),
  "--root",
  root,
  "--mode",
  "build",
]);

run(npm, ["run", "build:site"]);

run(process.execPath, [
  path.resolve(root, "tools/media/verify-media-system.mjs"),
  "--root",
  root,
  "--mode",
  "build",
  "--dist",
]);
