import path from "node:path";

import { getEnabledSitePages } from "../pages/manifest.ts";

export function pagePathToEntryPath(pagePath: string): string {
  if (pagePath === "/") return "index.html";
  if (pagePath.endsWith(".html")) return pagePath.replace(/^\//, "");
  return `${pagePath.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
}

export function createSiteInputs(root: string): Record<string, string> {
  return Object.fromEntries(
    getEnabledSitePages().map((page) => [
      page.id,
      path.resolve(root, pagePathToEntryPath(page.path)),
    ]),
  );
}
