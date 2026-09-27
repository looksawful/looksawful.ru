import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Matt Flow decision-phase adapters remain locally routed and policy-bounded", async () => {
  const [agents, tracker, sources, research, grill, wayfinder, toSpec, toTickets, implement] = await Promise.all([
    read("AGENTS.md"),
    read("docs/agents/issue-tracker.md"),
    read("docs/agents/skill-sources.md"),
    read(".agents/skills/research/SKILL.md"),
    read(".agents/skills/grill-with-docs/SKILL.md"),
    read(".agents/skills/wayfinder/SKILL.md"),
    read(".agents/skills/to-spec/SKILL.md"),
    read(".agents/skills/to-tickets/SKILL.md"),
    read(".agents/skills/implement/SKILL.md"),
  ]);

  assert.match(
    agents,
    /Research → CodebaseDesign → SetupMatt audit → Domain Modeling → Wayfinder or Grill → Spec → Tickets → TDD\/Implement → Code Review/,
  );
  assert.match(agents, /use `research`/);
  assert.match(agents, /use `wayfinder`/);
  assert.match(agents, /use `grill-with-docs`/);
  assert.match(agents, /use `to-spec`/);
  assert.match(agents, /use `to-tickets`/);
  assert.match(agents, /use `implement`/);

  assert.match(research, /^name: research$/m);
  assert.match(research, /primary sources/i);
  assert.match(research, /docs\/research/);
  assert.match(research, /Do not mix production implementation/);

  assert.match(grill, /^name: grill-with-docs$/m);
  assert.match(grill, /`domain-modeling`/);
  assert.match(grill, /never answer the human side/i);
  assert.match(grill, /does not grant merge, deploy, publish/i);

  assert.match(wayfinder, /^name: wayfinder$/m);
  assert.match(wayfinder, /docs\/agents\/issue-tracker\.md/);
  for (const label of [
    "wayfinder:map",
    "wayfinder:research",
    "wayfinder:prototype",
    "wayfinder:grilling",
    "wayfinder:task",
  ]) {
    assert.match(tracker, new RegExp(label.replace(":", "\\:")));
    assert.match(wayfinder, new RegExp(label.replace(":", "\\:")));
  }
  assert.match(wayfinder, /do not create a map/i);
  assert.match(wayfinder, /do not invent aliases/i);

  assert.match(sources, /c55ee46073ed923f86ce59a5eb3b6d895095d1b7/);
  assert.match(toSpec, /^name: to-spec$/m);
  assert.match(toSpec, /Problem Statement/);
  assert.match(toSpec, /ready-for-agent/);
  assert.match(toSpec, /docs\/testing-policy\.md/);

  assert.match(toTickets, /^name: to-tickets$/m);
  assert.match(toTickets, /tracer-bullet/i);
  assert.match(toTickets, /Parent/);
  assert.match(toTickets, /Blocked by/);
  assert.match(toTickets, /Never pretend a native relationship/i);

  assert.match(implement, /^name: implement$/m);
  assert.match(implement, /`tdd`/);
  assert.match(implement, /`code-review`/);
  assert.match(implement, /KEEP \/ MOVE \/ DELETE/);
  assert.match(implement, /Do not merge, deploy, publish CMS state/i);

  assert.match(sources, /Research, Grill, Wayfinder, Spec, Tickets and Implement/);
});
