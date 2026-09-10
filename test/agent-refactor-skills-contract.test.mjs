import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const skills = [
  "looksawful-editorial-bridge",
  "looksawful-design-audit",
  "looksawful-visual-production",
  "looksawful-game-refactor",
];

function readFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, "skill must start with YAML frontmatter");

  const name = match[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = match[1].match(/^description:\s*["']?([\s\S]*?)["']?$/m)?.[1]?.trim();
  return { name, description };
}

test("deep-refactor skill adapters have stable discoverable frontmatter", async () => {
  for (const skill of skills) {
    const source = await readFile(`.agents/skills/${skill}/SKILL.md`, "utf8");
    const frontmatter = readFrontmatter(source);

    assert.equal(frontmatter.name, skill, `${skill} frontmatter name must match its directory`);
    assert.ok(frontmatter.description, `${skill} must declare a discovery description`);
    assert.ok(frontmatter.description.length >= 40, `${skill} description must explain its trigger`);
  }
});

test("deep-refactor skill adapters are recorded in the pinned provenance registry", async () => {
  const provenance = await readFile("docs/agents/skill-sources.md", "utf8");

  for (const skill of skills) {
    assert.match(provenance, new RegExp(`\\b${skill}\\b`), `${skill} must be present in skill-sources.md`);
  }

  assert.match(provenance, /looksawful\/looksawful-editorial/);
  assert.match(provenance, /openai\/plugins/);
  assert.match(provenance, /anthropics\/claude-code/);
});
