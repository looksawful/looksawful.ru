import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { berryIntro, berryStoryMockups } from "../src/data/content/berry.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";

const contentPath = "src/content/standalone-projects/berry-social-content-2020.json";
const adapterPath = "src/data/content/berry-editorial.ts";

const clone = (value) => structuredClone(value);

// RED contract: storage and adapter are intentionally required before implementation exists.
test("Berry standalone Project has a strict CMS-owned editorial source", async () => {
  assert.equal(existsSync(contentPath), true, `${contentPath} must exist`);
  assert.equal(existsSync(adapterPath), true, `${adapterPath} must exist`);

  const source = JSON.parse(await readFile(contentPath, "utf8"));
  assert.deepEqual(
    Object.keys(source).sort(),
    ["head", "title", "role", "period", "summary", "lead"].sort(),
  );

  const { berryEditorialContent, parseBerryEditorialContent } = await import(
    "../src/data/content/berry-editorial.ts"
  );

  assert.deepEqual(berryEditorialContent, source);
  assert.deepEqual(parseBerryEditorialContent(clone(source)), source);

  const unexpected = clone(source);
  unexpected.route = "/work/changed-by-cms/";
  assert.throws(() => parseBerryEditorialContent(unexpected), /unexpected|field|key/i);

  const whitespace = clone(source);
  whitespace.title = "   ";
  assert.throws(() => parseBerryEditorialContent(whitespace), /non-empty|string/i);
});

test("Berry CMS editorial values flow through the existing Project intro renderer", async () => {
  const source = JSON.parse(await readFile(contentPath, "utf8"));

  assert.equal(berryIntro.head.type, "text");
  assert.equal(berryIntro.head.text, source.head);
  assert.equal(berryIntro.title.type, "text");
  assert.equal(berryIntro.title.text, source.title);
  assert.equal(berryIntro.role, source.role);
  assert.equal(berryIntro.period, source.period);
  assert.equal(berryIntro.summary, source.summary);
  assert.equal(berryIntro.lead, source.lead);

  const rendered = renderProjectIntro(berryIntro);
  for (const value of Object.values(source)) {
    assert.ok(rendered.includes(value), `Rendered Berry intro must contain current CMS value: ${value}`);
  }

  assert.deepEqual(
    berryStoryMockups.map(({ entryId, device, theme, captionView }) => ({
      entryId,
      device,
      theme,
      captionView,
    })),
    [
      { entryId: "berry-02-source-01-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay" },
      { entryId: "berry-02-source-02-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay" },
      { entryId: "berry-02-source-03-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay" },
      { entryId: "berry-02-source-04-9x16-use-01", device: "mobile", theme: "dark", captionView: "overlay" },
    ],
  );
});

test("Pages CMS exposes Berry copy without route, discovery, taxonomy or media controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: berry-standalone-project\n");
  assert.notEqual(start, -1, "Berry standalone Project CMS entry must exist");
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n      - name: ", 8);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  assert.match(config, /type: file/);
  assert.match(config, /path: src\/content\/standalone-projects\/berry-social-content-2020\.json/);
  assert.match(config, /create: false/);
  assert.match(config, /rename: false/);
  assert.match(config, /delete: false/);

  for (const field of ["head", "title", "role", "period", "summary", "lead"]) {
    assert.match(config, new RegExp(`name: ${field}\\b`));
  }

  for (const forbidden of [
    "id",
    "route",
    "href",
    "listed",
    "indexable",
    "enabled",
    "clientIds",
    "engagementIds",
    "roleIds",
    "projectTypeIds",
    "entryId",
    "device",
    "theme",
    "captionView",
    "layout",
  ]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }

  const page = sitePages.find((candidate) => candidate.id === "project:berry-social-content-2020");
  assert.ok(page);
  assert.equal(page.path, "/work/berry-social-content-2020/");
  assert.deepEqual(page.discovery, { listed: false, indexable: false });
});
