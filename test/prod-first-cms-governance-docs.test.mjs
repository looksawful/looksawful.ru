import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const GOVERNANCE_FILES = [
  "docs/cms-architecture.md",
  "docs/cms-handbook.md",
  ".agents/skills/looksawful-media-cms/SKILL.md",
];

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("authoritative CMS guidance uses prod-first authoring and keeps dev archival", async () => {
  for (const path of GOVERNANCE_FILES) {
    const text = await source(path);

    assert.match(
      text,
      /`prod`[^\n]*(active|working|source[- ]of[- ]truth|рабоч)/i,
      `${path} must identify prod as the active working/source-of-truth branch`,
    );
    assert.match(
      text,
      /`dev`[^\n]*(archive|архив)/i,
      `${path} must identify dev as archive-only`,
    );
    assert.match(
      text,
      /content\/\*/i,
      `${path} must describe temporary content/* authoring branches/worktrees`,
    );
    assert.doesNotMatch(
      text,
      /Pages CMS edits `dev`|CMS working source[^\n]*`dev`|ordinary work[^\n]*`dev`|обычная работа[^\n]*`dev`|edit\/save branch:\s*dev|dev\s*->\s*prod|`dev`\s*->\s*`prod`|content\/text-cms/i,
      `${path} must not teach the superseded dev-first or permanent content/text-cms topology`,
    );
  }
});
