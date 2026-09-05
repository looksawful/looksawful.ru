import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { pagePathToEntryPath } from "../src/site/build/inputs.ts";
import { getEnabledSitePages } from "../src/site/pages/manifest.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path.join(directory, entry.name), relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }

  return files;
}

test("repository root contains only intentional source directories", async () => {
  const ignored = new Set([".cache", ".git", "dist", "node_modules"]);
  const expected = [
    ".agents",
    ".github",
    "docs",
    "public",
    "shootings",
    "src",
    "test",
    "tools",
    "work",
  ];
  const directories = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !ignored.has(entry.name))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(directories, expected);
});

test("every enabled SitePage has an existing build source", async () => {
  for (const page of getEnabledSitePages()) {
    if (page.build.kind === "vite") {
      const entryPath = pagePathToEntryPath(page.path);
      assert.equal(
        await exists(entryPath),
        true,
        `missing Vite entry for ${page.id}: ${entryPath}`,
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

test("runtime TypeScript entry points do not retain JavaScript compatibility shims", async () => {
  assert.equal(await exists("src/main.js"), false, "src/main.js must be retired");
  assert.equal(
    await exists("src/interactive.js"),
    false,
    "src/interactive.js must be retired",
  );
});

test("authored JavaScript under src is limited to the explicitly tracked legacy migrations", async () => {
  const allowed = [
    "components/animated-canvas-gallery.js",
    "components/awful-cases-game.js",
  ];
  const javascript = (await collectFiles(path.join(root, "src")))
    .filter((file) => file.endsWith(".js"))
    .sort();

  assert.deepEqual(javascript, allowed);
});

test("application-only development tooling has an explicit src/devtools boundary", async () => {
  assert.equal(
    await exists("src/devtools/media-desk/server.ts"),
    true,
    "Media Desk server must live under src/devtools",
  );
  assert.equal(
    await exists("src/tools"),
    false,
    "src/tools is ambiguous with repository-level tools/",
  );
});

test("site HTML rendering helpers have one unambiguous renderer-support location", async () => {
  assert.equal(
    await exists("src/site/renderers/lib/html.ts"),
    true,
    "generic renderer HTML helper must live under src/site/renderers/lib",
  );
  assert.equal(
    await exists("src/site/rendering"),
    false,
    "src/site/rendering duplicates the src/site/renderers concept",
  );
});
