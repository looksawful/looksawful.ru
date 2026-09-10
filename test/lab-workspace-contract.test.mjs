import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Lab is a Vite build entry and is explicitly non-indexable", async () => {
  const [viteConfig, labHtml] = await Promise.all([
    read("vite.config.ts"),
    read("lab/index.html"),
  ]);

  assert.match(viteConfig, /lab:\s*fileURLToPath\(new URL\("\.\/lab\/index\.html"/);
  assert.match(labHtml, /<meta name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(labHtml, /src="\/src\/lab\/index\.ts"/);
});

test("Lab deployment can only publish the lab branch to the isolated preview project", async () => {
  const workflow = await read(".github/workflows/lab-preview.yml");

  assert.match(workflow, /branches: \[lab\]/);
  assert.match(workflow, /CLOUDFLARE_PAGES_PROJECT: looksawful-ru-preview/);
  assert.match(workflow, /pages deploy dist --project-name=looksawful-ru-preview --branch=lab/);
  assert.doesNotMatch(workflow, /--branch=prod/);
  assert.match(workflow, /Build Lab without production analytics/);
  assert.match(workflow, /x-robots-tag:/i);
});

test("Lab custom domain targets the Cloudflare branch alias and stays proxied", async () => {
  const bootstrap = await read("tools/lab/configure-cloudflare.mjs");

  assert.match(bootstrap, /customDomain.*lab\./s);
  assert.match(bootstrap, /branchAlias = `\$\{branch\}\.\$\{project\}\.pages\.dev`/);
  assert.match(bootstrap, /type: "CNAME"/);
  assert.match(bootstrap, /proxied: true/);
});

test("Local Lab command opens the workbench instead of production", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.scripts.lab, "vite --open /lab/");
});
