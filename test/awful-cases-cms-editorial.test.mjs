import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  awfulCasesDemo,
  awfulCasesIntro,
  awfulCasesSettingsMockup,
} from "../src/data/content/awful-cases.ts";
import { otherProjects } from "../src/data/catalog/projects/other.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { renderProjectIntro } from "../src/templates/project-intro.ts";
import { escapeHtml } from "../src/utils/html.ts";

const contentPath = "src/content/standalone-projects/awful-cases.json";
const adapterPath = "src/data/content/awful-cases-editorial.ts";

const clone = (value) => structuredClone(value);

test("Awful Cases has a strict CMS-owned editorial source", async () => {
  assert.equal(existsSync(contentPath), true, `${contentPath} must exist`);
  assert.equal(existsSync(adapterPath), true, `${adapterPath} must exist`);

  const source = JSON.parse(await readFile(contentPath, "utf8"));
  assert.deepEqual(
    Object.keys(source).sort(),
    ["head", "title", "role", "period", "summary", "lead"].sort(),
  );

  const { awfulCasesEditorialContent, parseAwfulCasesEditorialContent } = await import(
    "../src/data/content/awful-cases-editorial.ts"
  );

  assert.deepEqual(awfulCasesEditorialContent, source);
  assert.deepEqual(parseAwfulCasesEditorialContent(clone(source)), source);

  const unexpected = clone(source);
  unexpected.route = "/work/changed-by-cms/";
  assert.throws(() => parseAwfulCasesEditorialContent(unexpected), /unexpected|field|key/i);

  const whitespace = clone(source);
  whitespace.summary = "   ";
  assert.equal(parseAwfulCasesEditorialContent(whitespace).summary, "");

  const missing = clone(source);
  delete missing.title;
  assert.equal(parseAwfulCasesEditorialContent(missing).title, "");

  const invalid = clone(source);
  invalid.lead = 42;
  assert.throws(() => parseAwfulCasesEditorialContent(invalid), /string/i);
});

test("Awful Cases CMS copy feeds the intro and matching catalog fields", async () => {
  const source = JSON.parse(await readFile(contentPath, "utf8"));

  assert.equal(awfulCasesIntro.head.type, "text");
  assert.equal(awfulCasesIntro.head.text, source.head);
  assert.equal(awfulCasesIntro.title.type, "text");
  assert.equal(awfulCasesIntro.title.text, source.title);
  assert.equal(awfulCasesIntro.role, source.role);
  assert.equal(awfulCasesIntro.period, source.period);
  assert.equal(awfulCasesIntro.summary, source.summary);
  assert.equal(awfulCasesIntro.lead, source.lead);

  const rendered = renderProjectIntro(awfulCasesIntro);
  for (const value of Object.values(source)) {
    assert.ok(
      rendered.includes(escapeHtml(value)),
      `Rendered Awful Cases intro must contain the escaped current CMS value: ${value}`,
    );
  }

  const project = otherProjects.find((candidate) => candidate.id === "awful-cases");
  assert.ok(project);
  assert.equal(project.name, source.title);
  assert.equal(project.date, source.period);
  assert.equal(project.summary, source.summary);
  assert.equal(project.description, source.lead);
});

test("Awful Cases CMS leaves links, media, route and discovery code-owned", async () => {
  assert.deepEqual(awfulCasesIntro.links, [
    { label: "GitHub", href: "https://github.com/looksawful/awful-cases", rel: "noopener", target: "_blank" },
    { label: "Download ZIP", href: "https://github.com/looksawful/awful-cases/archive/refs/heads/main.zip" },
  ]);

  assert.deepEqual(
    {
      entryId: awfulCasesDemo.entryId,
      presentation: awfulCasesDemo.presentation,
      captionView: awfulCasesDemo.captionView,
      video: awfulCasesDemo.video,
    },
    {
      entryId: "awful-cases-assets-recording-2026-08-15-121210-use-01",
      presentation: "banner",
      captionView: "full",
      video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" },
    },
  );

  assert.deepEqual(
    {
      entryId: awfulCasesSettingsMockup.entryId,
      device: awfulCasesSettingsMockup.device,
      theme: awfulCasesSettingsMockup.theme,
      captionView: awfulCasesSettingsMockup.captionView,
    },
    {
      entryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
      device: "desktop",
      theme: "dark",
      captionView: "full",
    },
  );

  const page = sitePages.find((candidate) => candidate.id === "project:awful-cases");
  assert.ok(page);
  assert.equal(page.path, "/work/awful-cases/");
  assert.deepEqual(page.discovery, { listed: false, indexable: false });
});

test("Pages CMS exposes Awful Cases copy without link, route, taxonomy or media controls", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("      - name: awful-cases-standalone-project\n");
  assert.notEqual(start, -1, "Awful Cases standalone Project CMS entry must exist");

  const rest = cms.slice(start);
  const nextSibling = rest.indexOf("\n      - name: ", 8);
  const nextTopLevel = rest.indexOf("\n  - name: ", 8);
  const boundaries = [nextSibling, nextTopLevel].filter((index) => index !== -1);
  const end = boundaries.length ? Math.min(...boundaries) : rest.length;
  const config = rest.slice(0, end);

  assert.match(config, /type: file/);
  assert.match(config, /path: src\/content\/standalone-projects\/awful-cases\.json/);
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
    "presentation",
    "video",
  ]) {
    assert.doesNotMatch(config, new RegExp(`name: ${forbidden}\\b`));
  }
});
