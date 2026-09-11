import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { authorizeContentDeskWrite } from "./content-desk-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--write");
const writeMode = process.argv.slice(2).includes("--write");
const host = "127.0.0.1";

function git(...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function writeProvenance() {
  git("fetch", "--no-tags", "--quiet", "origin", "prod");
  const branch = git("branch", "--show-current");
  const originProd = git("rev-parse", "origin/prod");
  const mergeBase = git("merge-base", "HEAD", "origin/prod");
  return {
    branch,
    baseBranch: "prod",
    baseIsFresh: mergeBase === originProd,
    ci: process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true",
    host,
  };
}

const childEnv = {
  ...process.env,
  CONTENT_DESK_WRITE: "0",
  VITE_CONTENT_DESK_WRITE: "0",
};

if (writeMode) {
  let decision;
  try {
    decision = authorizeContentDeskWrite(writeProvenance());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[content-desk] cannot verify write provenance: ${message}`);
    process.exit(1);
  }

  if (!decision.ok) {
    console.error(`[content-desk] write mode blocked: ${decision.reason}`);
    process.exit(1);
  }

  childEnv.CONTENT_DESK_WRITE = "1";
  childEnv.VITE_CONTENT_DESK_WRITE = "1";
}

const args = [
  vite,
  "--host",
  host,
  "--open",
  "/tools/media-desk/",
  ...forwardedArgs,
];

const child = spawn(process.execPath, args, {
  cwd: root,
  stdio: "inherit",
  env: childEnv,
});

child.once("error", (error) => {
  console.error(`[content-desk] ${error.message}`);
  process.exitCode = 1;
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
