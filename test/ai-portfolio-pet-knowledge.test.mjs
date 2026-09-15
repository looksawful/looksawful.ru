import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { cvContent } from "../src/data/cv.ts";
import { getVisibleProjectCardPresentations } from "../src/data/projects.ts";

const moduleUrl = new URL("../src/features/portfolio-pet/knowledge.ts", import.meta.url);

test("AI portfolio pet knowledge is derived from canonical public site data", async () => {
  assert.equal(existsSync(moduleUrl), true, "missing AI portfolio pet knowledge module");
  const knowledge = await import(moduleUrl);

  const candidates = knowledge.buildPortfolioPetKnowledgeCandidates();
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  assert.equal(byId.get("profile.name")?.text, cvContent.profile.name);
  assert.equal(byId.get("profile.role")?.text, cvContent.profile.role);
  assert.equal(byId.get("profile.about")?.text, cvContent.profile.aboutPrimary);
  assert.equal(byId.get("profile.name")?.source, "cv.profile.name");

  const visibleProjects = getVisibleProjectCardPresentations();
  for (const project of visibleProjects) {
    const candidate = byId.get(`project.${project.id}`);
    assert.ok(candidate, `missing project candidate: ${project.id}`);
    assert.equal(candidate.title, project.title);
    assert.equal(candidate.source, `project-card.${project.id}`);
    assert.equal(candidate.approval, "pending");
  }

  assert.equal(
    candidates.some((candidate) => candidate.id === "contact.phone"),
    false,
    "phone must not be added to assistant knowledge candidates by default",
  );

  const approved = knowledge.selectApprovedKnowledge(candidates, ["profile.name", "profile.role"]);
  assert.deepEqual(
    approved.map(({ id }) => id),
    ["profile.name", "profile.role"],
  );
  assert.ok(approved.every(({ approval }) => approval === "approved"));

  assert.throws(
    () => knowledge.selectApprovedKnowledge(candidates, ["does.not.exist"]),
    /unknown knowledge candidate/,
  );
});
