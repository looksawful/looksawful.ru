import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

import sharp from "sharp";

const execFileAsync = promisify(execFile);
const scriptPath = new URL("../tools/sync-project-cover-metadata.mjs", import.meta.url);

async function makeFixture() {
  const root = await mkdtemp(join(tmpdir(), "looksawful-cover-metadata-"));
  const publicRoot = join(root, "public");
  const coverDir = join(publicRoot, "media", "projects", "index");
  const contentPath = join(root, "projects.json");
  await mkdir(coverDir, { recursive: true });

  await sharp({
    create: {
      width: 321,
      height: 123,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .webp()
    .toFile(join(coverDir, "test-cover.webp"));

  const source = [
    {
      id: "test-project",
      visible: true,
      title: "Test",
      focus: "Preserve me",
      role: "Designer",
      period: "2026",
      cover: {
        src: "/media/projects/index/test-cover.webp",
        alt: "Test cover",
        width: 1,
        height: 1,
      },
    },
  ];

  await writeFile(contentPath, `${JSON.stringify(source, null, 2)}\n`, "utf8");
  return { root, publicRoot, contentPath, source };
}

async function runSync(args) {
  return execFileAsync(process.execPath, [scriptPath.pathname, ...args], {
    cwd: new URL("..", import.meta.url),
  });
}

test("project-cover metadata sync derives WebP dimensions and preserves authored fields", async () => {
  const fixture = await makeFixture();
  try {
    await runSync(["--content", fixture.contentPath, "--public-root", fixture.publicRoot]);
    const updated = JSON.parse(await readFile(fixture.contentPath, "utf8"));

    assert.equal(updated[0].cover.width, 321);
    assert.equal(updated[0].cover.height, 123);
    assert.equal(updated[0].id, fixture.source[0].id);
    assert.equal(updated[0].title, fixture.source[0].title);
    assert.equal(updated[0].focus, fixture.source[0].focus);
    assert.equal(updated[0].role, fixture.source[0].role);
    assert.equal(updated[0].period, fixture.source[0].period);
    assert.equal(updated[0].cover.src, fixture.source[0].cover.src);
    assert.equal(updated[0].cover.alt, fixture.source[0].cover.alt);

    const afterFirstSync = await readFile(fixture.contentPath, "utf8");
    await runSync(["--content", fixture.contentPath, "--public-root", fixture.publicRoot]);
    assert.equal(await readFile(fixture.contentPath, "utf8"), afterFirstSync, "second sync must be a no-op");
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("project-cover metadata check fails stale data and passes synchronized data", async () => {
  const fixture = await makeFixture();
  try {
    await assert.rejects(
      runSync(["--check", "--content", fixture.contentPath, "--public-root", fixture.publicRoot]),
      /metadata|dimension|stale|out of date/i,
    );

    await runSync(["--content", fixture.contentPath, "--public-root", fixture.publicRoot]);
    await runSync(["--check", "--content", fixture.contentPath, "--public-root", fixture.publicRoot]);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("project-cover metadata sync rejects files outside the scoped WebP source", async () => {
  const fixture = await makeFixture();
  try {
    const source = JSON.parse(await readFile(fixture.contentPath, "utf8"));
    source[0].cover.src = "/media/projects/other/not-allowed.webp";
    await writeFile(fixture.contentPath, `${JSON.stringify(source, null, 2)}\n`, "utf8");

    await assert.rejects(
      runSync(["--content", fixture.contentPath, "--public-root", fixture.publicRoot]),
      /project|cover|scope|path/i,
    );

    source[0].cover.src = "/media/projects/index/not-webp.png";
    await writeFile(fixture.contentPath, `${JSON.stringify(source, null, 2)}\n`, "utf8");

    await assert.rejects(
      runSync(["--content", fixture.contentPath, "--public-root", fixture.publicRoot]),
      /webp|extension/i,
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("Pages CMS no longer asks editors for project-cover width and height", async () => {
  const cms = await readFile(new URL("../.pages.yml", import.meta.url), "utf8");
  const start = cms.indexOf("  - name: project-cards\n");
  assert.notEqual(start, -1);
  const rest = cms.slice(start);
  const nextEntry = rest.indexOf("\n  - name: ", 4);
  const config = nextEntry === -1 ? rest : rest.slice(0, nextEntry);

  assert.match(config, /name: cover\b/);
  assert.match(config, /name: src\b/);
  assert.match(config, /name: alt\b/);
  assert.doesNotMatch(config, /name: width\b/);
  assert.doesNotMatch(config, /name: height\b/);
});

test("dev and PR verification derive cover metadata before validation", async () => {
  const verifyDev = await readFile(new URL("../.github/workflows/verify-dev.yml", import.meta.url), "utf8");
  const verifyPr = await readFile(new URL("../.github/workflows/verify-pr.yml", import.meta.url), "utf8");

  for (const workflow of [verifyDev, verifyPr]) {
    const syncIndex = workflow.indexOf("sync-project-cover-metadata.mjs");
    const typecheckIndex = workflow.indexOf("npm run typecheck");
    assert.notEqual(syncIndex, -1, "workflow must derive project-cover metadata");
    assert.notEqual(typecheckIndex, -1, "workflow must typecheck");
    assert.ok(syncIndex < typecheckIndex, "cover metadata must be derived before typecheck");
  }

  assert.match(verifyDev, /src\/content\/projects\.json/);
  assert.match(verifyDev, /chore\(media\): sync CMS project cover metadata/);
});
