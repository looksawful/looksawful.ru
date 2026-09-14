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

test("Lab deployment stays isolated and syncs one password secret into the Pages preview runtime", async () => {
  const workflow = await read(".github/workflows/lab-preview.yml");

  assert.match(workflow, /branches: \[lab\]/);
  assert.match(workflow, /CLOUDFLARE_PAGES_PROJECT: looksawful-ru-preview/);
  assert.match(workflow, /pages deploy dist --project-name=looksawful-ru-preview --branch=lab/);
  assert.doesNotMatch(workflow, /--branch=prod/);
  assert.match(workflow, /Build Lab without production analytics/);
  assert.match(workflow, /Fast tests/);
  assert.match(workflow, /npm run test:fast/);
  assert.match(workflow, /Require Lab password/);
  assert.match(workflow, /Sync Lab password to Cloudflare Pages preview runtime/);
  assert.match(workflow, /pages secret put LAB_PASSWORD/);
  assert.match(workflow, /--env preview/);
  assert.match(workflow, /LAB_PASSWORD/);
  assert.match(workflow, /Verify Basic Auth on immutable deployment/);
  assert.doesNotMatch(workflow, /CF_ACCESS_CLIENT_(?:ID|SECRET)/);
  assert.doesNotMatch(workflow, /cloudflare-access\.mjs/);
  assert.match(workflow, /x-robots-tag:/i);
  assert.ok(
    workflow.indexOf("Sync Lab password to Cloudflare Pages preview runtime")
      < workflow.indexOf("Deploy persistent Lab branch preview"),
    "the encrypted runtime secret must exist before the protected deployment is published",
  );
  assert.ok(
    workflow.indexOf("Finalize Lab discovery before generated Storybook output")
      < workflow.indexOf("Build Lab design system"),
    "production discovery must finish before generated Storybook HTML is added",
  );
  assert.ok(
    workflow.indexOf("Generate Lab design-system inventory")
      < workflow.indexOf("Validate Lab local links after generated artifacts exist"),
    "local-link validation must run only after Lab generated routes exist",
  );
});

test("Lab Basic Auth middleware is fail-closed and makes the custom-domain root the private entry", async () => {
  const middleware = await read("functions/_middleware.js");

  assert.match(middleware, /USERNAME = "lab"/);
  assert.match(middleware, /LAB_PASSWORD/);
  assert.match(middleware, /CANONICAL_HOST = "lab\.looksawful\.ru"/);
  assert.match(middleware, /CANONICAL_PATH = "\/lab\/"/);
  assert.match(middleware, /WWW-Authenticate/);
  assert.match(middleware, /Authentication required/);
  assert.match(middleware, /authentication is not configured/i);
  assert.match(middleware, /503/);
  assert.match(middleware, /status: 302/);
  assert.match(middleware, /Cache-Control": "private, no-store"/);
  assert.match(middleware, /X-Frame-Options": "SAMEORIGIN"/);
  assert.match(middleware, /context\.next\(\)/);
  assert.match(middleware, /X-Robots-Tag/);
});

test("Lab custom domain targets the branch alias and stays proxied without Access provisioning", async () => {
  const bootstrap = await read("tools/lab/configure-cloudflare.mjs");

  assert.match(bootstrap, /customDomain.*lab\./s);
  assert.match(bootstrap, /branchAlias = `\$\{branch\}\.\$\{project\}\.pages\.dev`/);
  assert.match(bootstrap, /type: "CNAME"/);
  assert.match(bootstrap, /proxied: true/);
  assert.doesNotMatch(bootstrap, /\/access\//);
  assert.doesNotMatch(bootstrap, /CF_ACCESS_CLIENT/);
});

test("Local Lab command opens the workbench instead of production", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.scripts.lab, "vite --open /lab/");
});

test("Lab design system is a static Storybook viewer over canonical source", async () => {
  const [main, preview, storybookVite, builder, workflow, labHtml] = await Promise.all([
    read("tools/lab/storybook/main.mjs"),
    read("tools/lab/storybook/preview.mjs"),
    read("tools/lab/storybook/vite.config.mjs"),
    read("tools/lab/build-storybook.mjs"),
    read(".github/workflows/lab-preview.yml"),
    read("lab/index.html"),
  ]);

  assert.match(main, /@storybook\/html-vite/);
  assert.match(main, /@storybook\/addon-docs/);
  assert.match(main, /@storybook\/addon-a11y/);
  assert.match(main, /storybook-design-token/);
  assert.match(main, /designTokenGlob:\s*"src\/\*\*\/\*\.css"/);
  assert.match(main, /src\/lab\/stories/);
  assert.match(main, /@storybook\/builder-vite/);
  assert.match(main, /viteConfigPath:\s*storybookViteConfig/);
  assert.match(main, /new URL\("\.\/vite\.config\.mjs", import\.meta\.url\)/);
  assert.doesNotMatch(storybookVite, /vite\.config\.ts/);
  assert.doesNotMatch(storybookVite, /sitePagesPlugin|labPlugin|productionAssetBudgetPlugin/);
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

test("Lab Storybook exposes the canonical Awful + Contact release candidate", async () => {
  await assert.doesNotReject(() => read("src/lab/stories/portfolio-pet.stories.js"));
  const story = await read("src/lab/stories/portfolio-pet.stories.js");

  assert.match(story, /mountPortfolioPet/);
  assert.match(story, /mountContactFormHub/);
  assert.match(story, /03 Organisms\/Awful Contact/);
  assert.match(story, /Interactive/);
  assert.match(story, /ContactOpen/);
  assert.match(story, /LeftFacing/);
  assert.match(story, /HiddenRestore/);
  assert.match(story, /ReducedMotion/);
  assert.match(story, /portfolio-pet\.css/);
  assert.match(story, /contact-form-hub\.css/);
});

test("Lab Storybook documents the canonical contact form owner separately", async () => {
  await assert.doesNotReject(() => read("src/lab/stories/contact-form-hub.stories.js"));
  const story = await read("src/lab/stories/contact-form-hub.stories.js");
  assert.match(story, /mountContactFormHub/);
  assert.match(story, /03 Organisms\/Contact Form Hub/);
  assert.match(story, /Open/);
  assert.match(story, /ShortMobile/);
  assert.match(story, /contact-form-hub\.css/);
});

test("immutable Lab verification tolerates Cloudflare static propagation after auth activates", async () => {
  const workflow = await read(".github/workflows/lab-preview.yml");
  const start = workflow.indexOf("Verify Basic Auth on immutable deployment");
  const end = workflow.indexOf("Verify immutable Lab entry and design system");
  const verification = workflow.slice(start, end);

  assert.match(verification, /for attempt in \{1\.\.20\}/);
  assert.match(verification, /lab-version\.json\?sha=\$GITHUB_SHA/);
  assert.match(verification, /jq -e --arg sha "\$GITHUB_SHA"/);
  assert.match(verification, /sleep 3/);
  assert.match(verification, /did not expose exact Lab identity/);
});

test("immutable Lab bundle verification polls real Lab and Storybook routes until Pages propagation completes", async () => {
  const workflow = await read(".github/workflows/lab-preview.yml");
  const start = workflow.indexOf("Verify immutable Lab entry and design system");
  const end = workflow.indexOf("Verify stable Lab branch alias");
  const verification = workflow.slice(start, end);

  assert.match(verification, /for attempt in \{1\.\.20\}/);
  assert.match(verification, /\$PREVIEW_URL\/lab\/\?sha=\$GITHUB_SHA/);
  assert.match(verification, /\$PREVIEW_URL\/lab\/system\//);
  assert.match(verification, /\$PREVIEW_URL\/lab\/system\/inventory\.html/);
  assert.match(verification, /immutable Lab bundle was not ready/);
  assert.match(verification, /sleep 3/);
});
