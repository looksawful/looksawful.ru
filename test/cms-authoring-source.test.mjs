import assert from "node:assert/strict";
import test from "node:test";

import { validateCmsAuthoringBranch } from "../tools/cms-authoring-source.mjs";

test("temporary content branches are the only valid CMS publication sources", () => {
  for (const branch of [
    "content/cv-refresh",
    "content/media/jestei-hero",
    "content/2026-09-11-copy",
  ]) {
    assert.deepEqual(validateCmsAuthoringBranch(branch), { valid: true, branch });
  }

  for (const branch of [
    "dev",
    "prod",
    "content/text-cms",
    "content/",
    "content//broken",
    "content/../prod",
    "content/has space",
    "feature/cms-copy",
    "fix/content-copy",
  ]) {
    const result = validateCmsAuthoringBranch(branch);
    assert.equal(result.valid, false, `${branch} must be rejected`);
    assert.equal(result.branch, branch);
    assert.ok(result.reason, `${branch} rejection must explain why`);
  }
});
