import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { authorizeContentDeskWrite } from "./content-desk-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const requestedArgs = process.argv.slice(2);
const forwardedArgs = requestedArgs.filter((arg) => arg !== "--write");
const writeMode = requestedArgs.includes("--write");
const host = "127.0.0.1";

function git(...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function optionalGit(fallback, ...args) {
  try {
    const value = git(...args);
    return value || fallback;
  } catch {
    return fallback;
  }
}

function currentProvenance() {
  const branch = optionalGit("detached", "branch", "--show-current");
  const head = optionalGit("unknown", "rev-parse", "HEAD");
  const dirty = optionalGit("", "status", "--porcelain") !== "";
  const prodBase = optionalGit("unknown", "rev-parse", "origin/prod");
  const prodDivergence = optionalGit(
    "unavailable",
    "rev-list",
    "--left-right",
    "--count",
    "origin/prod...HEAD",
  );
  const mergeBase = optionalGit("unknown", "merge-base", "HEAD", "origin/prod");

  return {
    branch,
    head,
    dirty,
    prodBase,
    prodDivergence,
    baseBranch: "prod",
    baseIsFresh: prodBase !== "unknown" && mergeBase === prodBase,
    ci: process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true",
    host,
  };
}

let provenance = currentProvenance();

if (writeMode) {
  try {
    git("fetch", "--no-tags", "--quiet", "origin", "prod");
    provenance = currentProvenance();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[content-desk] cannot verify write provenance: ${message}`);
    process.exit(1);
  }

  const decision = authorizeContentDeskWrite(provenance);
  if (!decision.ok) {
    console.error(`[content-desk] write mode blocked: ${decision.reason}`);
    process.exit(1);
  }
}

const childEnv = {
  ...process.env,
  CONTENT_DESK_WRITE: writeMode ? "1" : "0",
  VITE_CONTENT_DESK_WRITE: writeMode ? "1" : "0",
  VITE_CONTENT_DESK_MODE: writeMode ? "write" : "read-only",
  VITE_CONTENT_DESK_BRANCH: provenance.branch,
  VITE_CONTENT_DESK_HEAD: provenance.head,
  VITE_CONTENT_DESK_DIRTY: provenance.dirty ? "1" : "0",
  VITE_CONTENT_DESK_PROD_BASE: provenance.prodBase,
  VITE_CONTENT_DESK_PROD_DIVERGENCE: provenance.prodDivergence,
};

console.log(
  `[content-desk] ${writeMode ? "WRITE" : "READ ONLY"} | branch=${provenance.branch} | head=${provenance.head} | prod=${provenance.prodBase} | divergence=${provenance.prodDivergence} | dirty=${provenance.dirty ? "yes" : "no"}`,
);

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
