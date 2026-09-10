import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertAllowedSiteUrl,
  classifyAction,
  isPublicSafeAction,
  parseIssueCommand,
  requiresConfirmation,
  validateDiskPath,
  validateMetrikaGoalPayload,
} from "../tools/yandex-control.mjs";

const workflow = () =>
  readFile(new URL("../.github/workflows/yandex-control.yml", import.meta.url), "utf8");

test("Yandex control accepts only the explicit owner command grammar", () => {
  assert.deepEqual(parseIssueCommand("[yandex-control] webmaster-recrawl", '{"url":"https://www.looksawful.ru/"}'), {
    action: "webmaster-recrawl",
    payload: { url: "https://www.looksawful.ru/" },
  });
  assert.throws(() => parseIssueCommand("[yandex-control] arbitrary-shell", "{}"), /unsupported Yandex control action/);
  assert.throws(() => parseIssueCommand("webmaster-recrawl", "{}"), /invalid Yandex control title/);
});

test("Yandex control confines recrawl URLs to the canonical public site", () => {
  assert.equal(assertAllowedSiteUrl("https://www.looksawful.ru/work/jestei-pool/"), "https://www.looksawful.ru/work/jestei-pool/");
  assert.throws(() => assertAllowedSiteUrl("http://www.looksawful.ru/"), /HTTPS/);
  assert.throws(() => assertAllowedSiteUrl("https://example.com/"), /www\.looksawful\.ru/);
  assert.throws(() => assertAllowedSiteUrl("https://user:pass@www.looksawful.ru/"), /credentials/);
  assert.throws(() => assertAllowedSiteUrl("https://www.looksawful.ru/#secret"), /fragment/);
});

test("public repository mode never exposes private reporting or management reads", () => {
  for (const action of ["webmaster-status", "webmaster-recrawl", "webmaster-recrawl-status", "metrika-access-check"]) {
    assert.equal(isPublicSafeAction(action), true, action);
  }
  for (const action of [
    "metrika-summary", "metrika-goals", "metrika-counter",
    "metrika-goal-create", "metrika-goal-update", "metrika-goal-delete",
    "disk-info", "disk-list", "disk-mkdir", "disk-move", "disk-copy", "disk-delete",
    "cloud-inventory",
  ]) assert.equal(isPublicSafeAction(action), false, action);
});

test("control actions have explicit risk classes and destructive confirmation", () => {
  assert.equal(classifyAction("webmaster-status"), "read");
  assert.equal(classifyAction("metrika-goal-create"), "write");
  assert.equal(classifyAction("disk-move"), "write");
  assert.equal(classifyAction("metrika-goal-delete"), "destructive");
  assert.equal(classifyAction("disk-delete"), "destructive");
  assert.equal(requiresConfirmation("disk-delete"), true);
  assert.equal(requiresConfirmation("metrika-goal-delete"), true);
  assert.equal(requiresConfirmation("metrika-goal-create"), false);
});

test("Yandex Disk paths are confined to an explicit project root", () => {
  process.env.YANDEX_DISK_ROOT = "/looksawful";
  assert.equal(validateDiskPath("/looksawful/backups/site.zip"), "/looksawful/backups/site.zip");
  assert.equal(validateDiskPath("disk:/looksawful/assets"), "disk:/looksawful/assets");
  assert.throws(() => validateDiskPath("/other-project/file.txt"), /\/looksawful/);
  assert.throws(() => validateDiskPath("../looksawful/file.txt"), /absolute/);
  assert.throws(() => validateDiskPath("/looksawful/../private"), /traversal/);
  delete process.env.YANDEX_DISK_ROOT;
});

test("Metrika goal mutations accept only supported structured goals", () => {
  assert.deepEqual(validateMetrikaGoalPayload({ name: "portfolio_contact", type: "action", conditions: [{ type: "exact", url: "portfolio_contact" }] }), {
    name: "portfolio_contact", type: "action", conditions: [{ type: "exact", url: "portfolio_contact" }],
  });
  assert.throws(() => validateMetrikaGoalPayload({ name: "x", type: "arbitrary" }), /unsupported Metrika goal type/);
  assert.throws(() => validateMetrikaGoalPayload({ name: "", type: "action" }), /goal name/);
});

test("Yandex control workflow gates secrets behind an owner-only issue job", async () => {
  const source = await workflow();
  assert.match(source, /^name: Yandex Control/m);
  assert.match(source, /issues:\s*\n\s*types:\s*\[opened\]/);
  assert.match(source, /pull_request:/);
  assert.doesNotMatch(source, /pull_request_target:/);
  assert.match(source, /github\.event\.issue\.user\.login == github\.repository_owner/);
  assert.match(source, /startsWith\(github\.event\.issue\.title, '\[yandex-control\] '\)/);
  assert.match(source, /permissions:\s*\n\s*contents: read/);
  assert.match(source, /issues: write/);
  assert.match(source, /YANDEX_OAUTH_TOKEN:\s*\$\{\{ secrets\.YANDEX_OAUTH_TOKEN \}\}/);
  assert.match(source, /YANDEX_DISK_ROOT:/);
  assert.match(source, /YANDEX_CLOUD_ID:/);
  assert.match(source, /YANDEX_CLOUD_FOLDER_ID:/);
  assert.doesNotMatch(source, /YANDEX_CONTROL_PRIVATE_OUTPUT:\s*["']?1/);
  assert.match(source, /persist-credentials: false/);
  assert.doesNotMatch(source, /repository_dispatch:/);
  assert.doesNotMatch(source, /workflow_dispatch:/);
});

test("Yandex control workflow self-verifies on relevant PR changes", async () => {
  const source = await workflow();
  assert.match(source, /test\/yandex-control-workflow\.test\.mjs/);
  assert.match(source, /tools\/yandex-control\.mjs/);
  assert.match(source, /node --test test\/yandex-control-workflow\.test\.mjs/);
  assert.match(source, /github\.event_name == 'pull_request'/);
});
