import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { sitePages } from "../src/site/pages/manifest.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const legacyMediaDeskPath = "tools/media-desk/src";

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolute, base));
      continue;
    }
    if (entry.isFile()) {
      files.push(path.relative(base, absolute).replaceAll(path.sep, "/"));
    }
  }
  return files;
}

test("repository root contains only intentional source directories", async () => {
  const entries = await readdir(root, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .filter((name) => !["node_modules", "dist", "dist-lab"].includes(name))
    .sort();

  assert.deepEqual(directories, [
    "content",
    "docs",
    "lab",
    "public",
    "src",
    "test",
    "tools",
  ]);
});

test("every enabled SitePage has an existing build source", async () => {
  for (const page of sitePages.filter((candidate) => candidate.enabled)) {
    if (page.build.kind === "vite-entry") {
      assert.equal(
        await exists(page.build.sourcePath),
        true,
        `missing Vite entry for ${page.id}: ${page.build.sourcePath}`,
      );
      continue;
    }

    assert.equal(
      await exists(page.build.sourcePath),
      true,
      `missing public-static source for ${page.id}: ${page.build.sourcePath}`,
    );
  }
});

test("the obsolete interactive JavaScript compatibility shim is retired", async () => {
  assert.equal(
    await exists("src/interactive.js"),
    false,
    "src/interactive.js must be retired after its test consumer moves to TypeScript",
  );
});

test("authored production JavaScript under src is limited to explicitly tracked legacy migrations and the still-consumed main entry shim", async () => {
  const allowed = [
    "components/animated-canvas-gallery.js",
    "components/awful-cases-game.js",
    "components/jestei-theme-organism/jestei-theme-organism.js",
    "main.js",
  ];
  const javascript = (await collectFiles(path.join(root, "src")))
    .filter((file) => file.endsWith(".js"))
    .filter((file) => !file.startsWith("lab/"))
    .sort();

  assert.deepEqual(javascript, allowed);
});

test("Lab Storybook JavaScript remains isolated from the production JavaScript migration guard", async () => {
  const labJavascript = (await collectFiles(path.join(root, "src", "lab")))
    .filter((file) => file.endsWith(".js"))
    .sort();

  assert.ok(labJavascript.length > 0, "expected Storybook JavaScript under src/lab");
  assert.ok(
    labJavascript.every((file) => file.startsWith("stories/") && file.endsWith(".stories.js")),
    `unexpected authored JavaScript in src/lab: ${labJavascript.join(", ")}`,
  );
});

test("application development tooling has a canonical src/devtools boundary", async () => {
  assert.equal(
    await exists("src/devtools/media-desk/server.ts"),
    true,
    "Media Desk application tooling must be available from src/devtools",
  );
  assert.equal(
    await exists(legacyMediaDeskPath),
    false,
    "legacy Media Desk source boundary must stay retired",
  );
});

test("external Media Desk consumers use the canonical src/devtools path", async () => {
  const files = await collectFiles(root);
  const searchable = files.filter((file) =>
    /\.(?:mjs|ts|json|md|yml|yaml|ps1)$/.test(file) &&
    !file.startsWith("node_modules/") &&
    !file.startsWith("dist/") &&
    !file.startsWith("dist-lab/")
  );
  const offenders = [];
  for (const file of searchable) {
    const content = await readFile(path.join(root, file), "utf8");
    if (content.includes(legacyMediaDeskPath)) offenders.push(file);
  }
  assert.deepEqual(offenders, ["test/repository-structure.test.mjs"]);
});

test("literal .gitattributes paths point to files that still exist", async () => {
  const attributes = await readFile(path.join(root, ".gitattributes"), "utf8");
  const literalPaths = attributes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/\s+/)[0])
    .filter((value) => value && !/[?*\[]/.test(value));

  for (const relativePath of literalPaths) {
    assert.equal(
      await exists(relativePath),
      true,
      `.gitattributes references missing path: ${relativePath}`,
    );
  }
});
