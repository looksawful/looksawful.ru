import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { getEnabledSitePages } from "../pages/manifest.ts";

const BLOG_ENTRY_MARKER = "<!-- GENERATED BLOG ENTRY: tools/prepare-blog-entries.mjs -->";

export function pagePathToEntryPath(pagePath: string): string {
  if (pagePath === "/") return "index.html";
  if (pagePath.endsWith(".html")) return pagePath.replace(/^\//, "");
  return `${pagePath.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
}

function getPreparedBlogInputs(root: string): readonly [string, string][] {
  const blogRoot = path.resolve(root, "blog");
  let entries;
  try { entries = readdirSync(blogRoot, { withFileTypes: true }); } catch { return []; }

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const filePath = path.join(blogRoot, entry.name, "index.html");
      try {
        const source = readFileSync(filePath, "utf8");
        return source.includes(BLOG_ENTRY_MARKER) ? [`blog:${entry.name}`, filePath] as const : null;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is readonly [string, string] => entry !== null)
    .toSorted(([left], [right]) => left.localeCompare(right, "en"));
}

export function createSiteInputs(root: string): Record<string, string> {
  const staticInputs = getEnabledSitePages().map((page) => [
    page.id,
    path.resolve(root, pagePathToEntryPath(page.path)),
  ] as const);

  return Object.fromEntries([...staticInputs, ...getPreparedBlogInputs(root)]);
}
