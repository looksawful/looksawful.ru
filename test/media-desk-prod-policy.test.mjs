import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const launcher = await readFile(
  new URL("../tools/run-content-desk.mjs", import.meta.url),
  "utf8",
);

async function loadPolicy() {
  return import("../tools/content-desk-policy.mjs");
}

test("Media Desk defaults to read-only and exposes a separate guarded write command", async () => {
  assert.equal(packageJson.scripts.desk, "node tools/run-content-desk.mjs");
  assert.equal(packageJson.scripts["desk:write"], "node tools/run-content-desk.mjs --write");
  assert.doesNotMatch(packageJson.scripts.desk, /media:ensure|media:sync/);
  assert.match(launcher, /127\.0\.0\.1/);
  assert.doesNotMatch(launcher, /CONTENT_DESK_WRITE:\s*["']1["']/);
  assert.doesNotMatch(launcher, /VITE_CONTENT_DESK_WRITE:\s*["']1["']/);

  const { authorizeContentDeskWrite } = await loadPolicy();
  assert.equal(typeof authorizeContentDeskWrite, "function");
});

test("Desk write authorization accepts only temporary content branches from prod and fails closed elsewhere", async () => {
  const { authorizeContentDeskWrite } = await loadPolicy();

  const allowed = authorizeContentDeskWrite({
    branch: "content/media-caption-fix",
    baseBranch: "prod",
    baseIsFresh: true,
    ci: false,
    host: "127.0.0.1",
  });
  assert.equal(allowed.ok, true);

  for (const input of [
    { branch: "prod", baseBranch: "prod", baseIsFresh: true, ci: false, host: "127.0.0.1" },
    { branch: "dev", baseBranch: "prod", baseIsFresh: true, ci: false, host: "127.0.0.1" },
    { branch: "content/text-cms", baseBranch: "dev", baseIsFresh: true, ci: false, host: "127.0.0.1" },
    { branch: "feature/foo", baseBranch: "prod", baseIsFresh: true, ci: false, host: "127.0.0.1" },
    { branch: "content/foo", baseBranch: "prod", baseIsFresh: false, ci: false, host: "127.0.0.1" },
    { branch: "content/foo", baseBranch: "prod", baseIsFresh: true, ci: true, host: "127.0.0.1" },
    { branch: "content/foo", baseBranch: "prod", baseIsFresh: true, ci: false, host: "0.0.0.0" },
  ]) {
    assert.equal(authorizeContentDeskWrite(input).ok, false, JSON.stringify(input));
  }
});
