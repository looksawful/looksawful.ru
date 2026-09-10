import { readdir } from "node:fs/promises";
import path from "node:path";

function normalizeSlashes(value) {
  return value.replaceAll("\\", "/");
}

export function mapHtmlPathToRoute(filePath) {
  const normalized = normalizeSlashes(filePath).replace(/^\.\//, "");
  if (normalized === "index.html") return "/";

  const publicRelative = normalized.startsWith("public/")
    ? normalized.slice("public/".length)
    : normalized;

  if (publicRelative.endsWith("/index.html")) {
    const dir = publicRelative.slice(0, -"index.html".length);
    return `/${dir}`.replace(/\/{2,}/g, "/");
  }

  return `/${publicRelative}`.replace(/\/{2,}/g, "/");
}

export function shouldExcludeRoute(route, exclusions = []) {
  return exclusions.some((prefix) => route === prefix || route.startsWith(prefix));
}

async function walkHtml(dir, rootDir, out) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtml(absolute, rootDir, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      out.push(normalizeSlashes(path.relative(rootDir, absolute)));
    }
  }
}

export async function discoverPageRoutes({
  rootDir = process.cwd(),
  exclusions = [],
} = {}) {
  const files = ["index.html"];
  await walkHtml(path.join(rootDir, "public"), rootDir, files);

  const seen = new Set();
  const pages = [];
  for (const sourcePath of files) {
    const route = mapHtmlPathToRoute(sourcePath);
    if (shouldExcludeRoute(route, exclusions) || seen.has(route)) continue;
    seen.add(route);
    pages.push({ route, sourcePath });
  }

  pages.sort((a, b) => a.route.localeCompare(b.route));
  return pages;
}
