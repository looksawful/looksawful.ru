import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const step = (workflow, name) => workflow.match(new RegExp(`      - name: ${name}\\n[\\s\\S]*?(?=\\n      - name: |$)`))?.[0] ?? "";

test("repository has a cheap guard against heavyweight source files", async () => {
  const guardUrl = new URL("../tools/ci/check-repository-growth.mjs", import.meta.url);
  assert.equal(existsSync(guardUrl), true, "repository growth guard script must exist");

  const { scripts } = JSON.parse(await read("package.json"));
  assert.equal(scripts["check:repo-growth"], "node tools/ci/check-repository-growth.mjs");

  const fastWorkflow = await read(".github/workflows/ci-fast.yml");
  assert.match(fastWorkflow, /npm run check:repo-growth/);

  const gitignore = await read(".gitignore");
  for (const extension of ["*.psd", "*.psb", "*.blend", "*.blend1", "*.aep", "*.7z", "*.zip", "*.rar"]) {
    assert.ok(gitignore.includes(extension), `missing heavy-source ignore: ${extension}`);
  }
});

test("CMS media fetches only the exact previous push commit instead of full history", async () => {
  const workflow = await read(".github/workflows/cms-media.yml");
  assert.doesNotMatch(workflow, /fetch-depth:\s*0/);
  assert.match(workflow, /fetch-depth:\s*1/);

  const previous = step(workflow, "Fetch previous push commit");
  assert.match(previous, /if: github\.event_name == 'push'/);
  assert.match(previous, /git fetch --no-tags --depth=1 origin "\$BEFORE"/);
});

test("CMS publication is shallow-first and only deepens topology history when required", async () => {
  const workflow = await read(".github/workflows/pages-cms-publish.yml");
  assert.doesNotMatch(workflow, /fetch-depth:\s*0/);
  assert.match(workflow, /fetch-depth:\s*1/);
  assert.match(workflow, /git fetch --no-tags --depth=1 origin/);
  assert.match(workflow, /--deepen=64/);
  assert.match(workflow, /--deepen=256/);
  assert.match(workflow, /--unshallow/);
});

test("Git LFS stays out of the GitHub Pages media contract", async () => {
  const attributes = await read(".gitattributes");
  assert.doesNotMatch(attributes, /filter=lfs|diff=lfs|merge=lfs/);

  const docs = await read("docs/tooling-pipeline.md");
  assert.match(docs, /Git LFS/i);
  assert.match(docs, /GitHub Pages/i);
  assert.match(docs, /--filter=blob:none/);
  assert.match(docs, /--depth=1/);
});
