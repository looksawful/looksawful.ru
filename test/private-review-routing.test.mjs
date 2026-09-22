import assert from "node:assert/strict";
import test from "node:test";
import { routeVisualReviewChanges } from "../tools/private-review/routing.ts";

const knownCaseIds = [
  "awful-mockups",
  "jestei-pool",
  "sensetique",
  "styx",
];

test("clearly non-visual repository docs skip visual review", () => {
  const route = routeVisualReviewChanges(
    [{ path: "docs/testing-policy.md", status: "modified" }],
    { knownCaseIds },
  );

  assert.equal(route.visualImpact, "none");
  assert.equal(route.reviewDepth, null);
  assert.equal(route.affectedCaseMode, "none");
  assert.deepEqual(route.affectedCaseIds, []);
});

test("case-owned authored content always routes to Quick visual review", () => {
  const route = routeVisualReviewChanges(
    [{ path: "src/content/cases/styx.json", status: "modified" }],
    { knownCaseIds },
  );

  assert.equal(route.visualImpact, "static");
  assert.equal(route.reviewDepth, "Quick");
  assert.equal(route.affectedCaseMode, "explicit");
  assert.deepEqual(route.affectedCaseIds, ["styx"]);
});

test("explicit user-visible text change can never be classified non-visual", () => {
  const route = routeVisualReviewChanges(
    [{
      path: "src/data/projects.ts",
      status: "modified",
      userVisibleText: true,
    }],
    { knownCaseIds },
  );

  assert.notEqual(route.visualImpact, "none");
  assert.equal(route.reviewDepth, "Quick");
  assert.equal(route.affectedCaseMode, "all");
  assert.deepEqual(route.affectedCaseIds, knownCaseIds);
});

test("shared UI declaration narrows affected Cases without losing visual review", () => {
  const route = routeVisualReviewChanges(
    [{ path: "src/components/project-card.ts", status: "modified" }],
    {
      knownCaseIds,
      declarations: [{
        path: "src/components/project-card.ts",
        caseIds: ["jestei-pool", "styx"],
      }],
    },
  );

  assert.equal(route.visualImpact, "static");
  assert.equal(route.reviewDepth, "Quick");
  assert.equal(route.affectedCaseMode, "explicit");
  assert.deepEqual(route.affectedCaseIds, ["jestei-pool", "styx"]);
});

test("interactive declaration raises review depth to Interactive", () => {
  const route = routeVisualReviewChanges(
    [{ path: "src/components/project-carousel.ts", status: "modified" }],
    {
      knownCaseIds,
      declarations: [{
        path: "src/components/project-carousel.ts",
        caseIds: ["awful-mockups", "jestei-pool"],
        minimumDepth: "Interactive",
      }],
    },
  );

  assert.equal(route.visualImpact, "interactive");
  assert.equal(route.reviewDepth, "Interactive");
  assert.equal(route.affectedCaseMode, "explicit");
  assert.deepEqual(route.affectedCaseIds, ["awful-mockups", "jestei-pool"]);
});

test("global shared UI fails closed to Full review for all Cases", () => {
  const route = routeVisualReviewChanges(
    [{ path: "src/styles/base.css", status: "modified" }],
    { knownCaseIds },
  );

  assert.equal(route.visualImpact, "global");
  assert.equal(route.reviewDepth, "Full");
  assert.equal(route.affectedCaseMode, "all");
  assert.deepEqual(route.affectedCaseIds, knownCaseIds);
});

test("ambiguous source change broadens to all Cases but starts at Quick", () => {
  const route = routeVisualReviewChanges(
    [{ path: "src/unknown/new-renderer.ts", status: "modified" }],
    { knownCaseIds },
  );

  assert.equal(route.visualImpact, "ambiguous");
  assert.equal(route.reviewDepth, "Quick");
  assert.equal(route.affectedCaseMode, "all");
  assert.deepEqual(route.affectedCaseIds, knownCaseIds);
});

test("unsafe paths fail closed to Full review", () => {
  const route = routeVisualReviewChanges(
    [{ path: "../src/components/card.ts", status: "modified" }],
    { knownCaseIds },
  );

  assert.equal(route.visualImpact, "global");
  assert.equal(route.reviewDepth, "Full");
  assert.equal(route.affectedCaseMode, "all");
  assert.match(route.reasons.join("\n"), /unsafe path/i);
});

test("rename considers both previous and current Case ownership", () => {
  const route = routeVisualReviewChanges(
    [{
      path: "src/content/cases/sensetique.json",
      previousPath: "src/content/cases/styx.json",
      status: "renamed",
    }],
    { knownCaseIds },
  );

  assert.equal(route.reviewDepth, "Quick");
  assert.equal(route.affectedCaseMode, "explicit");
  assert.deepEqual(route.affectedCaseIds, ["sensetique", "styx"]);
});

test("manual escalation is monotonic and may only broaden review", () => {
  const route = routeVisualReviewChanges(
    [{ path: "src/content/cases/styx.json", status: "modified" }],
    {
      knownCaseIds,
      minimumDepth: "Full",
      additionalCaseIds: ["jestei-pool"],
    },
  );

  assert.equal(route.reviewDepth, "Full");
  assert.deepEqual(route.affectedCaseIds, ["jestei-pool", "styx"]);
});


test("prefix declarations accept a trailing slash and map the subtree", () => {
  const route = routeVisualReviewChanges(
    [{ path: "src/components/cards/project-card.ts", status: "modified" }],
    {
      knownCaseIds,
      declarations: [{
        pathPrefix: "src/components/",
        caseIds: ["jestei-pool", "styx"],
      }],
    },
  );

  assert.equal(route.reviewDepth, "Quick");
  assert.equal(route.affectedCaseMode, "explicit");
  assert.deepEqual(route.affectedCaseIds, ["jestei-pool", "styx"]);
});
