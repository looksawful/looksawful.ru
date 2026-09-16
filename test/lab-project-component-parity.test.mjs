import { access, readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

import { projectComponentSurfaces } from "../src/content/contracts/project-component-surfaces.ts";
import {
  allowedProjectSurfaceCoverageStatuses,
  projectSurfaceStoryCoverage,
} from "../src/lab/storybook/project-surface-coverage.mjs";

const requiredSurfaceIds = projectComponentSurfaces
  .filter((surface) => surface.storybook === "required")
  .map((surface) => surface.id)
  .sort();

const coveredSurfaceIds = Object.keys(projectSurfaceStoryCoverage).sort();

test("every production project surface is explicitly accounted for in Lab Storybook", () => {
  assert.deepEqual(coveredSurfaceIds, requiredSurfaceIds);
});

test("direct and indirect Storybook coverage points to real story modules", async () => {
  for (const [surfaceId, coverage] of Object.entries(projectSurfaceStoryCoverage)) {
    assert.ok(
      allowedProjectSurfaceCoverageStatuses.includes(coverage.status),
      `${surfaceId} has unsupported coverage status ${coverage.status}`,
    );

    if (coverage.status === "blocked") {
      assert.ok(Number.isInteger(coverage.issue) && coverage.issue > 0, `${surfaceId} blocked coverage needs an issue`);
      assert.ok(coverage.reason?.trim(), `${surfaceId} blocked coverage needs a reason`);
      continue;
    }

    assert.match(coverage.storyFile, /\.stories\.(?:js|mjs)$/);
    await access(coverage.storyFile);
    const source = await readFile(coverage.storyFile, "utf8");
    assert.match(source, /export\s+default\s+/i, `${surfaceId} story module must export Storybook metadata`);
  }
});

test("Berserk specialized production surface is no longer invisible to Lab parity", () => {
  assert.equal(projectSurfaceStoryCoverage["berserk-timer-showcase"].status, "direct");
  assert.equal(
    projectSurfaceStoryCoverage["berserk-timer-showcase"].storyFile,
    "src/lab/stories/project-specialized.stories.mjs",
  );
});
