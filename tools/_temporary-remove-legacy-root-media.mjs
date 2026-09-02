import { execFileSync } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";

const resolverFiles = [
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "tools/media-dev-state.mjs",
  "tools/check-data-integrity.ts",
];

const rootFirstResolver = `  const candidates = [
    path.join(repoRoot, clean),
    path.join(repoRoot, "public", clean),
  ];`;
const publicResolver = `  const candidates = [
    path.join(repoRoot, "public", clean),
  ];`;

for (const filename of resolverFiles) {
  const source = await readFile(filename, "utf8");
  if (!source.includes(rootFirstResolver)) throw new Error(`expected root-first resolver not found in ${filename}`);
  await writeFile(filename, source.replace(rootFirstResolver, publicResolver), "utf8");
}

{
  const filename = "tools/sync-media-catalog.mjs";
  const source = await readFile(filename, "utf8");
  const before = '  const candidates = [path.join(repoRoot, clean), path.join(repoRoot, "public", clean)];';
  const after = '  const candidates = [path.join(repoRoot, "public", clean)];';
  if (!source.includes(before)) throw new Error("expected root-first sync resolver not found");
  await writeFile(filename, source.replace(before, after), "utf8");
}

{
  const filename = "tools/check-data-integrity.ts";
  const source = await readFile(filename, "utf8");
  const legacyLine = '      ...await walkFiles(path.join(repoRoot, "media")),\n';
  if (!source.includes(legacyLine)) throw new Error("expected legacy physical media scan line not found");
  await writeFile(filename, source.replace(legacyLine, ""), "utf8");
}

await writeFile(
  "test/media-root-ownership.test.mjs",
  `import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const toolingFiles = [
  "tools/build-responsive-media.mjs",
  "tools/build-video-media.mjs",
  "tools/media-dev-state.mjs",
  "tools/sync-media-catalog.mjs",
  "tools/check-data-integrity.ts",
];

test("repository has no legacy root media tree", async () => {
  let error = null;
  try {
    await access(new URL("../media/", import.meta.url));
  } catch (caught) {
    error = caught;
  }
  assert.ok(error, "root media/ must stay absent; public/media is canonical delivery storage");
  assert.equal(error.code, "ENOENT");
});

test("media tooling resolves URL-backed assets from public storage only", async () => {
  for (const filename of toolingFiles) {
    const source = await readFile(new URL(\`../\${filename}\`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /path\\.join\\(repoRoot,\\s*clean\\)/, \`\${filename} must not resolve through repoRoot/media\`);
    assert.match(source, /path\\.join\\(repoRoot,\\s*"public",\\s*clean\\)/, \`\${filename} must resolve through public storage\`);
  }

  const integrity = await readFile(new URL("../tools/check-data-integrity.ts", import.meta.url), "utf8");
  assert.doesNotMatch(integrity, /walkFiles\\(path\\.join\\(repoRoot,\\s*"media"\\)\\)/, "physical integrity scan must not treat legacy root media as delivery storage");
});
`,
  "utf8",
);

{
  const filename = "test/media-tools/integrity.test.mjs";
  const source = await readFile(filename, "utf8");
  const marker = 'test("integrity report never lets legacy root media shadow the public delivery file"';
  if (!source.includes(marker)) {
    await writeFile(
      filename,
      `${source.trimEnd()}\n\n` + `test("integrity report never lets legacy root media shadow the public delivery file", async () => {
  const root = await fixtureRoot("integrity-public-ownership");
  const publicImage = join(root, "public", "media", "fixtures", "shadow.webp");
  const legacyDir = join(root, "media", "fixtures");
  const legacyImage = join(legacyDir, "shadow.webp");
  await mkdir(legacyDir, { recursive: true });
  await sharp({ create: { width: 10, height: 6, channels: 3, background: "green" } }).webp().toFile(publicImage);
  await sharp({ create: { width: 3, height: 3, channels: 3, background: "red" } }).webp().toFile(legacyImage);

  const report = await createMediaIntegrityReport({
    repoRoot: root,
    mediaAssets: [
      { id: "public-shadow", type: "image", src: "/media/fixtures/shadow.webp", width: 10, height: 6 },
    ],
    mediaEntries: [{ id: "public-shadow-use", assetId: "public-shadow" }],
    scanPhysicalMedia: false,
  });

  assert.equal(report.errorCount, 0, report.errors.join("\\n"));
});\n`,
      "utf8",
    );
  }
}

execFileSync("git", ["rm", "-r", "media"], { stdio: "inherit" });
await unlink(".github/workflows/_temporary-remove-legacy-root-media.yml");
await unlink("tools/_temporary-remove-legacy-root-media.mjs");
