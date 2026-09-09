import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readOptional = async (path) => read(path).catch(() => "");

test("agent verification workflow is finite, exact-SHA scoped, chat-triggerable, and read-only", async () => {
  const workflow = await read(".github/workflows/agent-verify.yml");

  assert.match(workflow, /^name: Agent Verify/m);
  assert.match(workflow, /workflow_dispatch:\s*\n\s*inputs:/);
  assert.match(workflow, /issue_comment:\s*\n\s*types:\s*\[created\]/);
  assert.match(workflow, /target_sha:\s*\n[\s\S]*?required:\s*true/);
  assert.match(workflow, /suite:\s*\n[\s\S]*?type:\s*choice/);

  for (const suite of ["fast", "browser-smoke", "responsive"]) {
    assert.match(workflow, new RegExp(`- ${suite.replace("-", "\\-")}`));
  }

  assert.match(workflow, /author_association/);
  assert.match(workflow, /OWNER/);
  assert.match(workflow, /COLLABORATOR/);
  assert.match(workflow, /\/verify/);
  assert.match(workflow, /\[0-9a-fA-F\]\{40\}/);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
  assert.match(workflow, /ref:\s*\$\{\{\s*steps\.request\.outputs\.target_sha\s*\}\}/);
  assert.match(workflow, /git rev-parse HEAD/);
  assert.match(workflow, /npm run toolchain:doctor -- --json/);
  assert.match(workflow, /npm run test:fast/);
  assert.match(workflow, /npm run test:ui:responsive/);

  assert.doesNotMatch(workflow, /pull_request_target:/);
  assert.doesNotMatch(workflow, /permissions:[\s\S]*?contents:\s*write/);
  assert.doesNotMatch(workflow, /secrets:\s*inherit/);
  assert.doesNotMatch(workflow, /run:\s*\$\{\{\s*inputs\./);
});

test("proven headless consumers share one fixed browser setup and raw installs cannot regrow", async () => {
  const [action, agentVerify, responsive] = await Promise.all([
    readOptional(".github/actions/setup-browser/action.yml"),
    read(".github/workflows/agent-verify.yml"),
    read(".github/workflows/ui-responsive.yml"),
  ]);

  assert.match(action, /^name: Setup pinned headless browser/m);
  assert.match(action, /npx playwright install --with-deps --only-shell chromium/);
  assert.match(action, /node tools\/ci\/browser-launch-probe\.mjs/);
  assert.doesNotMatch(action, /^inputs:/m);
  assert.doesNotMatch(action, /actions\/cache|ms-playwright|playwright-chromium-/);

  for (const workflow of [agentVerify, responsive]) {
    assert.match(workflow, /uses: \.\/\.github\/actions\/setup-browser/);
    assert.doesNotMatch(workflow, /npx playwright install/);
    assert.doesNotMatch(workflow, /browser-launch-probe\.mjs/);
  }

  const legacyFullChromiumAllowlist = new Set([
    "caption-qa.yml",
    "pages.yml",
    "quality.yml",
  ]);
  const workflowNames = (await readdir(new URL("../.github/workflows/", import.meta.url)))
    .filter((name) => /\.ya?ml$/.test(name));

  for (const name of workflowNames) {
    const workflow = await read(`.github/workflows/${name}`);
    if (/npx playwright install/.test(workflow)) {
      assert.ok(
        legacyFullChromiumAllowlist.has(name),
        `raw Playwright install must use setup-browser or be an explicit legacy exception: ${name}`,
      );
    }
  }
});
