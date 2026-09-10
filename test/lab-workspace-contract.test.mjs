import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Lab is a Vite build entry and is explicitly non-indexable", async () => {
  const [viteConfig, labHtml, scratch] = await Promise.all([
    read("vite.config.ts"),
    read("lab/index.html"),
    read("src/lab/scratch.ts"),
  ]);

  assert.match(viteConfig, /lab:\s*fileURLToPath\(new URL\("\.\/lab\/index\.html"/);
  assert.match(labHtml, /<meta name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(labHtml, /src="\/src\/lab\/index\.ts"/);
  assert.match(labHtml, /src="\/src\/lab\/scratch\.ts"/);
  assert.match(scratch, /looksawful:lab:scratch-css:v1/);
  assert.match(scratch, /dataset\.labOnly = "scratch-css"/);
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

test("Lab design system is a static Storybook viewer over canonical source", async () => {
  const [main, preview, builder, workflow, labHtml] = await Promise.all([
    read("tools/lab/storybook/main.mjs"),
    read("tools/lab/storybook/preview.mjs"),
    read("tools/lab/build-storybook.mjs"),
    read(".github/workflows/lab-preview.yml"),
    read("lab/index.html"),
  ]);

  assert.match(main, /@storybook\/html-vite/);
  assert.match(main, /@storybook\/addon-docs/);
  assert.match(main, /@storybook\/addon-a11y/);
  assert.match(main, /storybook-design-token/);
  assert.match(main, /src\/lab\/stories/);
  assert.match(preview, /src\/styles\/index\.css/);
  assert.match(builder, /storybook@10\.6\.0/);
  assert.match(builder, /@storybook\/html-vite@10\.6\.0/);
  assert.match(builder, /@storybook\/addon-docs@10\.6\.0/);
  assert.match(builder, /@storybook\/addon-a11y@10\.6\.0/);
  assert.match(builder, /storybook-design-token@5\.0\.0/);
  assert.match(builder, /tools\/lab\/storybook/);
  assert.match(builder, /dist\/lab\/system/);
  assert.match(workflow, /Build Lab design system/);
  assert.match(workflow, /dist\/lab\/system\/index\.html/);
  assert.match(labHtml, /href="\/lab\/system\/"/);
  assert.match(labHtml, /href="\/lab\/system\/inventory\.html"/);
});

test("Lab design-system inventory is generated from canonical source rather than a hand-maintained registry", async () => {
  const [inventory, packageJsonText, workflow] = await Promise.all([
    read("tools/lab/design-system-inventory.mjs"),
    read("package.json"),
    read(".github/workflows/lab-preview.yml"),
  ]);

  assert.match(inventory, /src\/components/);
  assert.match(inventory, /src\/styles/);
  assert.match(inventory, /src\/templates/);
  assert.match(inventory, /system-inventory\.json/);
  assert.match(inventory, /inventory\.html/);
  assert.match(packageJsonText, /"lab:inventory":\s*"node tools\/lab\/design-system-inventory\.mjs"/);
  assert.match(workflow, /npm run lab:inventory/);
});
