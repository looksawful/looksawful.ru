import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), "utf8");

test("Yandex Clean-param collapses service and approved outreach parameters", async () => {
  const robots = await read("public/robots.txt");
  assert.match(
    robots,
    /User-agent: Yandex[\s\S]*Clean-param: sha&utm_source&utm_medium&utm_campaign&utm_content&utm_id(?:\s|$)/,
  );
});

test("production verification uses sha only for deploy-version and probes canonical URLs", async () => {
  const pages = await read(".github/workflows/pages.yml");
  const shaUrls = [...pages.matchAll(/https:\/\/www\.looksawful\.ru\/[^\"\s]*\?sha=\$\{GITHUB_SHA\}/g)]
    .map((match) => match[0]);

  assert.deepEqual(shaUrls, [
    "https://www.looksawful.ru/deploy-version.txt?sha=${GITHUB_SHA}",
  ]);
  assert.match(pages, /Cache-Control: no-cache/);
  assert.match(pages, /https:\/\/www\.looksawful\.ru\/robots\.txt\"/);
  assert.match(pages, /https:\/\/www\.looksawful\.ru\/sitemap\.xml\"/);
});
