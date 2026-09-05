import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CONTENT_BLOCK_TYPES } from "../src/content/contracts/content-block.ts";
import { sitePages } from "../src/site/pages/manifest.ts";
import { renderStandaloneEntityPage } from "../src/site/renderers/entity-page.ts";
import { renderContentBlock } from "../src/site/renderers/entity/content-block.ts";
import { collectContentDeskTextEntries } from "../src/tools/media-desk/editor-model.ts";

const awfulCasesSourcePath = "src/content/standalone-projects/awful-cases.json";

function awfulCasesPage() {
  const page = sitePages.find((candidate) => candidate.id === "project:awful-cases");
  assert.ok(page, "missing project:awful-cases SitePage");
  return page;
}

function awfulCasesCmsEntry(cms) {
  const start = cms.indexOf("      - name: awful-cases-standalone-project\n");
  assert.notEqual(start, -1, "Awful Cases Pages CMS entry must exist");
  const rest = cms.slice(start);
  const next = rest.indexOf("\n  - name: ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

test("code-block is a first-class ContentBlock rendered through the canonical boundary", () => {
  assert.equal(CONTENT_BLOCK_TYPES.includes("code-block"), true);

  const html = renderContentBlock({
    type: "code-block",
    data: {
      title: "Install <safe>",
      code: 'git clone <repo> && echo "x&y"',
      description: "Clone & run <locally>",
      language: "shell",
    },
  });

  assert.match(html, /class="code-block"/);
  assert.match(html, /data-code-block/);
  assert.match(html, /data-code-copy/);
  assert.match(html, /data-code-language="shell"/);
  assert.match(html, /data-code-copy-button/);
  assert.match(html, /data-code-source/);
  assert.match(html, /Install &lt;safe&gt;/);
  assert.match(html, /git clone &lt;repo&gt; &amp;&amp; echo &quot;x&amp;y&quot;/);
  assert.match(html, /Clone &amp; run &lt;locally&gt;/);
  assert.doesNotMatch(html, /<safe>|<repo>|<locally>/);
});

test("code-block keeps optional metadata optional", () => {
  const html = renderContentBlock({
    type: "code-block",
    data: {
      code: "echo ok",
    },
  });

  assert.match(html, /<pre><code[^>]*data-code-source[^>]*>echo ok<\/code><\/pre>/);
  assert.doesNotMatch(html, /code-block__title/);
  assert.doesNotMatch(html, /code-block__meta/);
  assert.doesNotMatch(html, /data-code-language=/);
});

test("Awful Cases owns install and run snippets in authored content and exposes them through Content Desk", async () => {
  const source = JSON.parse(await readFile(awfulCasesSourcePath, "utf8"));

  assert.deepEqual(source.codeBlocks, {
    install: {
      title: "Установка",
      code: "git clone https://github.com/looksawful/awful-cases.git\ncd awful-cases\\app",
    },
    run: {
      title: "Запуск",
      code: ".\\awful-cases.ahk",
    },
  });

  const { parseAwfulCasesEditorialContent } = await import(
    "../src/data/content/awful-cases-editorial.ts"
  );
  assert.deepEqual(parseAwfulCasesEditorialContent(structuredClone(source)), source);

  const structuralLeak = structuredClone(source);
  structuralLeak.codeBlocks.install.language = "powershell";
  assert.throws(
    () => parseAwfulCasesEditorialContent(structuralLeak),
    /unexpected|field|key/i,
  );

  const entries = collectContentDeskTextEntries({
    "../../content/standalone-projects/awful-cases.json": source,
  });
  const codeEntryPaths = entries
    .filter((entry) => entry.fieldPath.startsWith("codeBlocks."))
    .map((entry) => entry.fieldPath);
  assert.deepEqual(codeEntryPaths, [
    "codeBlocks.install.code",
    "codeBlocks.install.title",
    "codeBlocks.run.code",
    "codeBlocks.run.title",
  ]);
});

test("Pages CMS exposes authored Awful code fields but keeps rendering metadata protected", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const entry = awfulCasesCmsEntry(cms);

  assert.match(entry, /- name: codeBlocks\n\s+label: Кодовые блоки\n\s+type: object/);
  assert.match(entry, /- name: install\n\s+label: Установка\n\s+type: object/);
  assert.match(entry, /- name: run\n\s+label: Запуск\n\s+type: object/);
  assert.equal((entry.match(/- name: code\n/g) ?? []).length, 2);
  assert.equal((entry.match(/- name: title\n/g) ?? []).length >= 3, true);
  assert.doesNotMatch(entry, /- name: (?:language|variant|layout|skin)\n/);
});

test("canonical Awful Cases page renders authored code through CodeBlock with code-owned semantics", async () => {
  const { awfulCasesCodeBlocks } = await import("../src/data/content/awful-cases.ts");

  assert.deepEqual(awfulCasesCodeBlocks, {
    install: {
      title: "Установка",
      code: "git clone https://github.com/looksawful/awful-cases.git\ncd awful-cases\\app",
      language: "powershell",
    },
    run: {
      title: "Запуск",
      code: ".\\awful-cases.ahk",
      language: "powershell",
    },
  });

  const html = renderStandaloneEntityPage(awfulCasesPage());
  assert.match(html, /id="awful-cases-code"/);
  assert.equal((html.match(/data-code-block/g) ?? []).length, 2);
  assert.equal((html.match(/data-code-language="powershell"/g) ?? []).length, 2);
  assert.match(html, /git clone https:\/\/github\.com\/looksawful\/awful-cases\.git/);
  assert.match(html, /cd awful-cases\\app/);
  assert.match(html, /\.\\awful-cases\.ahk/);
});
