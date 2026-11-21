import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  awfulCasesCodeBlocks,
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
const introFields = ["head", "title", "role", "period", "summary", "lead"];

const clone = (value) => structuredClone(value);

test("Awful Cases has a strict CMS-owned editorial source", async () => {
  assert.equal(existsSync(contentPath), true, `${contentPath} must exist`);
  assert.equal(existsSync(adapterPath), true, `${adapterPath} must exist`);

  const source = JSON.parse(await readFile(contentPath, "utf8"));
  assert.deepEqual(
    Object.keys(source).sort(),
    [...introFields, "codeBlocks"].sort(),
  );
  assert.deepEqual(Object.keys(source.codeBlocks).sort(), ["install", "run"]);
  for (const id of ["install", "run"]) {
    assert.equal(typeof source.codeBlocks[id].title, "string");
    assert.equal(typeof source.codeBlocks[id].code, "string");
    assert.ok(source.codeBlocks[id].code.length > 0);
  }

  const { awfulCasesEditorialContent, parseAwfulCasesEditorialContent } = await import(
    "../src/data/content/awful-cases-editorial.ts"
  );

  assert.deepEqual(awfulCasesEditorialContent, source);
  assert.deepEqual(parseAwfulCasesEditorialContent(clone(source)), source);

  const unexpected = clone(source);
  unexpected.route = "/work/changed-by-cms/";
  assert.throws(() => parseAwfulCasesEditorialContent(unexpected), /unexpected|field|key/i);

  const structuralCodeMetadata = clone(source);
  structuralCodeMetadata.codeBlocks.install.language = "powershell";
  assert.throws(
    () => parseAwfulCasesEditorialContent(structuralCodeMetadata),
    /unexpected|field|key/i,
  );

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

test("Awful Cases CMS copy feeds intro, code blocks and matching catalog fields", async () => {
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
  for (const field of introFields) {
    assert.ok(
      rendered.includes(escapeHtml(source[field])),
      `Rendered Awful Cases intro must contain the escaped current CMS value: ${field}`,
    );
  }

  assert.equal(awfulCasesCodeBlocks.install.title, source.codeBlocks.install.title);
  assert.equal(awfulCasesCodeBlocks.install.code, source.codeBlocks.install.code);
  assert.equal(awfulCasesCodeBlocks.install.language, "powershell");
  assert.equal(awfulCasesCodeBlocks.run.title, source.codeBlocks.run.title);
  assert.equal(awfulCasesCodeBlocks.run.code, source.codeBlocks.run.code);
  assert.equal(awfulCasesCodeBlocks.run.language, "powershell");

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
