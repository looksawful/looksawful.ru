import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("private Lab is an isolated non-production build", async () => {
  const [labConfig, publicConfig, labHtml] = await Promise.all([
    read("vite.lab.config.ts"),
    read("vite.config.ts"),
    read("lab/index.html"),
  ]);

  assert.match(labConfig, /lab\/index\.html/);
  assert.match(labConfig, /127\.0\.0\.1/);
  assert.doesNotMatch(labConfig, /media-desk\/server/);
  assert.doesNotMatch(publicConfig, /lab\/index\.html/);
  assert.match(labHtml, /<meta name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(labHtml, /data-environment="non-production"/);
  assert.match(labHtml, /data-mode="read-only"/);
});

test("private Lab middleware is deployment-scoped, fail-closed, OAuth-protected, and non-indexable", async () => {
  const [middleware, oauth] = await Promise.all([
    read("lab/functions/_middleware.js"),
    read("lab/functions/github-oauth.js"),
  ]);

  assert.match(middleware, /github-oauth\.js/);
  assert.doesNotMatch(middleware, /LAB_PASSWORD|WWW-Authenticate|\bBasic\b/);
  assert.match(middleware, /503/);
  assert.match(middleware, /X-Robots-Tag/);
  assert.match(middleware, /noindex, nofollow, noarchive/);
  assert.match(middleware, /Cache-Control/);
  assert.match(middleware, /private, no-store/);
  assert.match(middleware, /X-Frame-Options/);
  assert.match(oauth, /ADMIN_GITHUB_CLIENT_ID/);
  assert.match(oauth, /ADMIN_GITHUB_CLIENT_SECRET/);
  assert.match(oauth, /ADMIN_SESSION_SECRET/);
});

test("Lab client stays read-only and carries exact build provenance fields", async () => {
  const source = await read("src/lab/index.ts");

  assert.match(source, /__LAB_BRANCH__/);
  assert.match(source, /__LAB_COMMIT__/);
  assert.match(source, /__LAB_BUILD_TIME__/);
  assert.match(source, /READ ONLY/);
  assert.doesNotMatch(source, /CONTENT_DESK_WRITE/);
  assert.doesNotMatch(source, /__media-desk\/api/);
  assert.doesNotMatch(source, /method:\s*["'](?:POST|PUT|PATCH|DELETE)/);
});

test("Lab organism catalog derives every canonical ContentBlock without crawling public DOM", async () => {
  const [{ CONTENT_BLOCK_TYPES }, { buildLabOrganismCatalog }] = await Promise.all([
    import("../src/content/contracts/content-block.ts"),
    import("../src/devtools/lab/organism-catalog.ts"),
  ]);

  const catalog = buildLabOrganismCatalog();
  const contentBlocks = catalog.filter((item) => item.kind === "content-block");

  assert.deepEqual(
    contentBlocks.map((item) => item.canonicalType),
    [...CONTENT_BLOCK_TYPES],
  );
  assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);

  const source = await read("src/devtools/lab/organism-catalog.ts");
  assert.match(source, /CONTENT_BLOCK_TYPES/);
  assert.doesNotMatch(source, /querySelector|querySelectorAll|document\.|fetch\(/);
});

test("Lab organism catalog keeps Berserk available as a hidden specialized runtime", async () => {
  const { buildLabOrganismCatalog } = await import("../src/devtools/lab/organism-catalog.ts");
  const catalog = buildLabOrganismCatalog();
  const berserk = catalog.find((item) => item.id === "berserk-audio-player");

  assert.ok(berserk);
  assert.equal(berserk.kind, "specialized-runtime");
  assert.equal(berserk.status, "HIDDEN");
  assert.equal(berserk.ownerModule, "src/components/berserk-audio-player.ts");
  assert.equal(berserk.selector, "[data-berserk-audio-player]");
  assert.equal(berserk.projectId, "berserk-timer");
});

test("Lab-only lifecycle overrides can mark canonical organisms WIP without inventing unknown entities", async () => {
  const { buildLabOrganismCatalog, LAB_ORGANISM_STATUSES } = await import(
    "../src/devtools/lab/organism-catalog.ts"
  );

  assert.deepEqual(LAB_ORGANISM_STATUSES, ["LIVE", "HIDDEN", "WIP", "EXPERIMENTAL", "DEPRECATED"]);

  const baseline = buildLabOrganismCatalog();
  const candidate = buildLabOrganismCatalog({
    "media-slider": { status: "WIP" },
  });

  assert.equal(baseline.find((item) => item.id === "media-slider")?.status, "LIVE");
  assert.equal(candidate.find((item) => item.id === "media-slider")?.status, "WIP");
  assert.throws(
    () => buildLabOrganismCatalog({ "invented-organism": { status: "WIP" } }),
    /unknown Lab organism/i,
  );
});
