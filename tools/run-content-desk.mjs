import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  assertContentDeskWriteAllowed,
  CONTENT_DESK_LOOPBACK_HOST,
} from "./content-desk-policy.mjs";

const vite = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const WRITE_FLAG = "--write";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function currentProvenance() {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const head = git(["rev-parse", "HEAD"]);
  const dirty = git(["status", "--porcelain"]) !== "";
  let devDivergence = "unavailable";
  try {
    devDivergence = git(["rev-list", "--left-right", "--count", "origin/dev...HEAD"]);
  } catch {}
  return { branch, head, dirty, devDivergence };
}

const requestedArgs = process.argv.slice(2);
const writeMode = requestedArgs.includes(WRITE_FLAG);
const passthroughArgs = requestedArgs.filter((arg) => arg !== WRITE_FLAG);
let provenance = {
  branch: "read-only",
  head: "unknown",
  dirty: false,
  devDivergence: "unavailable",
};

if (writeMode) {
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    assertContentDeskWriteAllowed({
      branch: "unknown",
      ci: Boolean(process.env.CI),
      githubActions: Boolean(process.env.GITHUB_ACTIONS),
      args: passthroughArgs,
    });
  }

  provenance = currentProvenance();
  assertContentDeskWriteAllowed({
    branch: provenance.branch,
    ci: Boolean(process.env.CI),
    githubActions: Boolean(process.env.GITHUB_ACTIONS),
    args: passthroughArgs,
  });
} else {
  try {
    provenance = currentProvenance();
  } catch {}
}

const mode = writeMode ? "WRITE" : "READ ONLY";
console.log(
  `[content-desk] ${mode} | branch=${provenance.branch} | head=${provenance.head} | dirty=${provenance.dirty ? "yes" : "no"} | dev-divergence=${provenance.devDivergence}`,
);

const args = [
  vite,
  "--host",
  CONTENT_DESK_LOOPBACK_HOST,
  "--open",
  "/tools/media-desk/",
  ...passthroughArgs,
];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    CONTENT_DESK_WRITE: writeMode ? "1" : "0",
    VITE_CONTENT_DESK_WRITE: writeMode ? "1" : "0",
    VITE_CONTENT_DESK_MODE: writeMode ? "write" : "read-only",
    VITE_CONTENT_DESK_BRANCH: provenance.branch,
    VITE_CONTENT_DESK_HEAD: provenance.head,
    VITE_CONTENT_DESK_DIRTY: provenance.dirty ? "1" : "0",
    VITE_CONTENT_DESK_DEV_DIVERGENCE: provenance.devDivergence,
  },
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
