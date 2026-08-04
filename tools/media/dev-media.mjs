#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const prepare = spawnSync(
  process.execPath,
  [path.resolve(root, "tools/media/prepare-media.mjs"), "--root", root],
  {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  },
);

if (prepare.status !== 0) {
  process.exit(prepare.status ?? 1);
}

const children = [
  spawn(npm, ["run", "dev:site"], {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  }),
  spawn(
    process.execPath,
    [path.resolve(root, "tools/media/watch-media.mjs"), "--root", root],
    {
      cwd: root,
      stdio: "inherit",
      windowsHide: true,
    },
  ),
];

let closing = false;

function close(code = 0) {
  if (closing) return;
  closing = true;

  for (const child of children) {
    if (!child.killed) child.kill();
  }

  setTimeout(() => process.exit(code), 50);
}

children[0].on("exit", (code) => {
  if (!closing) close(code ?? 0);
});

children[1].on("exit", (code) => {
  if (!closing && code && code !== 0) close(code);
});

process.on("SIGINT", () => close(0));
process.on("SIGTERM", () => close(0));
