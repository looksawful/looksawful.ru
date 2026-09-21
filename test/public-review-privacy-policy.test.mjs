import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const legacyWorkflow = path.join(root, ".github/workflows/pr-preview.yml");
const policyPath = path.join(root, "docs/agents/public-reporting.md");
const scanRoots = [
  path.join(root, ".github/workflows"),
  path.join(root, "tools"),
  path.join(root, "src/lab"),
];

const forbidden = [
  ["legacy public preview project", /looksawful-ru-preview/iu],
  ["public Pages preview hostname", /pages\.dev/iu],
  ["legacy public preview comment marker", /looksawful-cloudflare-pr-preview/iu],
];

async function textFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await textFiles(absolute));
      continue;
    }
    if (/\.(?:cjs|js|json|md|mjs|ts|yml|yaml)$/iu.test(entry.name)) files.push(absolute);
  }
  return files;
}

test("public automation has no pre-production review publication path", async () => {
  await assert.rejects(access(legacyWorkflow), (error) => error?.code === "ENOENT");

  const files = (await Promise.all(scanRoots.map(textFiles))).flat();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    for (const [label, pattern] of forbidden) {
      assert.doesNotMatch(source, pattern, `${relative} reintroduces ${label}`);
    }
  }
});

test("public reporting policy keeps pre-production visual review private", async () => {
  const policy = await readFile(policyPath, "utf8");
  assert.match(policy, /production is the only public rendered version/iu);
  assert.match(policy, /pre-production.*must stay private/isu);
  assert.match(policy, /noindex.*does not make.*private/isu);
  assert.match(policy, /screenshots.*review manifests.*visual diffs/isu);
});
