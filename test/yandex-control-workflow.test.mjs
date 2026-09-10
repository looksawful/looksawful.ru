import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertAllowedSiteUrl,
  isPublicSafeAction,
  parseIssueCommand,
} from "../tools/yandex-control.mjs";

const workflow = () =>
  readFile(new URL("../.github/workflows/yandex-control.yml", import.meta.url), "utf8");

test("Yandex control accepts only the explicit owner command grammar", () => {
  assert.deepEqual(
    parseIssueCommand(
      "[yandex-control] webmaster-recrawl",
      '{"url":"https://www.looksawful.ru/"}',
    ),
    {
      action: "webmaster-recrawl",
      payload: { url: "https://www.looksawful.ru/" },
    },
  );

  assert.throws(
    () => parseIssueCommand("[yandex-control] arbitrary-shell", "{}"),
    /unsupported Yandex control action/,
  );
  assert.throws(
    () => parseIssueCommand("webmaster-recrawl", "{}"),
    /invalid Yandex control title/,
  );
});

test("Yandex control confines recrawl URLs to the canonical public site", () => {
  assert.equal(
    assertAllowedSiteUrl("https://www.looksawful.ru/work/jestei-pool/"),
    "https://www.looksawful.ru/work/jestei-pool/",
  );
  assert.throws(
    () => assertAllowedSiteUrl("http://www.looksawful.ru/"),
    /HTTPS/,
  );
  assert.throws(
    () => assertAllowedSiteUrl("https://example.com/"),
    /www\.looksawful\.ru/,
  );
  assert.throws(
    () => assertAllowedSiteUrl("https://user:pass@www.looksawful.ru/"),
    /credentials/,
  );
  assert.throws(
    () => assertAllowedSiteUrl("https://www.looksawful.ru/#secret"),
    /fragment/,
  );
});

test("public repository mode never exposes private Metrika reporting actions", () => {
  for (const action of [
    "webmaster-status",
    "webmaster-recrawl",
    "webmaster-recrawl-status",
    "metrika-access-check",
  ]) {
    assert.equal(isPublicSafeAction(action), true, action);
  }

  for (const action of ["metrika-summary", "metrika-goals"]) {
    assert.equal(isPublicSafeAction(action), false, action);
  }
});

test("Yandex control workflow gates secrets behind an owner-only issue job", async () => {
  const source = await workflow();

  assert.match(source, /^name: Yandex Control/m);
  assert.match(source, /issues:\s*\n\s*types:\s*\[opened\]/);
  assert.match(source, /pull_request:/);
  assert.doesNotMatch(source, /pull_request_target:/);
  assert.match(
    source,
    /github\.event\.issue\.user\.login == github\.repository_owner/,
  );
  assert.match(
    source,
    /startsWith\(github\.event\.issue\.title, '\[yandex-control\] '\)/,
  );
  assert.match(source, /permissions:\s*\n\s*contents: read/);
  assert.match(source, /issues: write/);
  assert.match(source, /YANDEX_OAUTH_TOKEN:\s*\$\{\{ secrets\.YANDEX_OAUTH_TOKEN \}\}/);
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
