import { access, mkdir, readFile, readdir, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { getPublishedBlogEntries, loadBlogEntries } from "../src/site/blog/loader.ts";

export const BLOG_ENTRY_MARKER = "<!-- GENERATED BLOG ENTRY: tools/prepare-blog-entries.mjs -->";

function renderStub(slug) {
  return `<!DOCTYPE html>\n<html lang="ru">\n  <head>\n    <meta charset="utf-8">\n    <title>${slug}</title>\n  </head>\n  <body>${BLOG_ENTRY_MARKER}</body>\n</html>\n`;
}

async function pathExists(filePath) {
  try { await access(filePath); return true; } catch { return false; }
}

async function removeStaleOwnedStubs(blogRoot, expectedSlugs) {
  let entries = [];
  try { entries = await readdir(blogRoot, { withFileTypes: true }); } catch { return; }

  for (const entry of entries) {
    if (!entry.isDirectory() || expectedSlugs.has(entry.name)) continue;
    const filePath = path.join(blogRoot, entry.name, "index.html");
    if (!(await pathExists(filePath))) continue;
    const source = await readFile(filePath, "utf8");
    if (!source.includes(BLOG_ENTRY_MARKER)) continue;
    await unlink(filePath);
    await rmdir(path.dirname(filePath)).catch(() => {});
  }
}

export async function prepareBlogEntryStubs(root, entries) {
  const blogRoot = path.resolve(root, "blog");
  const published = getPublishedBlogEntries(entries);
  const expectedSlugs = new Set(published.map((entry) => entry.slug));

  await mkdir(blogRoot, { recursive: true });
  await removeStaleOwnedStubs(blogRoot, expectedSlugs);

  for (const entry of published) {
    const directory = path.join(blogRoot, entry.slug);
    const filePath = path.join(directory, "index.html");
    await mkdir(directory, { recursive: true });
    const next = renderStub(entry.slug);
    const current = await readFile(filePath, "utf8").catch(() => null);
    if (current === next) continue;
    if (current !== null && !current.includes(BLOG_ENTRY_MARKER)) {
      throw new Error(`[blog] refusing to overwrite unowned entry stub: ${filePath}`);
    }
    await writeFile(filePath, next, "utf8");
  }
}

export async function prepareBlogEntries(root = process.cwd()) {
  const entries = await loadBlogEntries(path.resolve(root, "src/content/blog"));
  await prepareBlogEntryStubs(root, entries);
}

const directPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (directPath === import.meta.url) await prepareBlogEntries(fileURLToPath(new URL("../", import.meta.url)));
