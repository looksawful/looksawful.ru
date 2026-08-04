#!/usr/bin/env node
import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { MEDIA_PATHS } from "./media.config.mjs";

function parseArguments(argv) {
  const options = {
    root: process.cwd(),
    debounce: 180,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--root") options.root = argv[++index];
    else if (argument === "--debounce") options.debounce = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${argument}`);
  }

  options.root = path.resolve(options.root);
  return options;
}

const options = parseArguments(process.argv.slice(2));
const sourceRoot = path.resolve(options.root, MEDIA_PATHS.sources);
const prepareScript = path.resolve(
  options.root,
  "tools/media/prepare-media.mjs",
);

if (!existsSync(sourceRoot)) {
  console.error(`Media source root does not exist: ${sourceRoot}`);
  process.exit(1);
}

let timer = null;
let running = false;
let rerun = false;

function runPrepare() {
  if (running) {
    rerun = true;
    return;
  }

  running = true;
  const child = spawn(
    process.execPath,
    [prepareScript, "--root", options.root],
    {
      cwd: options.root,
      stdio: "inherit",
      windowsHide: true,
    },
  );

  child.on("exit", (code) => {
    running = false;

    if (code !== 0) {
      console.error(`Media prepare failed with exit code ${code}.`);
    }

    if (rerun) {
      rerun = false;
      runPrepare();
    }
  });
}

function queuePrepare(eventType, filename) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`Media changed: ${eventType} ${filename ?? ""}`.trim());
    runPrepare();
  }, options.debounce);
}

const watcher = watch(
  sourceRoot,
  {
    recursive: true,
  },
  queuePrepare,
);

function close() {
  clearTimeout(timer);
  watcher.close();
}

process.on("SIGINT", () => {
  close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  close();
  process.exit(0);
});

console.log(`Watching canonical media: ${sourceRoot}`);
