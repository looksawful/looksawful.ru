import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("agent verification workflow is finite, exact-SHA scoped, and read-only", async () => {
  const workflow = await read(".github/workflows/agent-verify.yml");

  assert.match(workflow, /^name: Agent Verify/m);
  assert.match(workflow, /workflow_dispatch:\s*\n\s*inputs:/);
  assert.match(workflow, /target_sha:\s*\n[\s\S]*?required:\s*true/);
  assert.match(workflow, /suite:\s*\n[\s\S]*?type:\s*choice/);

  for (const suite of ["fast", "browser-smoke", "responsive"]) {
    assert.match(workflow, new RegExp(`- ${suite.replace("-", "\\-")}`));
  }

  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /ref:\s*\$\{\{\s*inputs\.target_sha\s*\}\}/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /npm run toolchain:doctor -- --json/);
  assert.match(workflow, /npm run test:fast/);
  assert.match(workflow, /browser-launch-probe\.mjs/);
  assert.match(workflow, /npm run test:ui:responsive/);

  assert.doesNotMatch(workflow, /pull_request_target:/);
  assert.doesNotMatch(workflow, /permissions:[\s\S]*?contents:\s*write/);
  assert.doesNotMatch(workflow, /secrets:\s*inherit/);
  assert.doesNotMatch(workflow, /run:\s*\$\{\{\s*inputs\./);
});
