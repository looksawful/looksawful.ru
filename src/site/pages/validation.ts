import { cases } from "../../data/catalog/cases.ts";
import { collections } from "../../data/catalog/collections.ts";
import { projects } from "../../data/catalog/projects/index.ts";
import type { SitePageDefinition } from "./types.ts";

const caseIds = new Set(cases.map((item) => item.id));
const collectionIds = new Set(collections.map((item) => item.id));
const projectIds = new Set(projects.map((item) => item.id));

function isHtmlDocumentPath(path: string): boolean {
  return /\/[^/]+\.html$/i.test(path);
}

export function normalizePagePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Site page path must not be empty");

  let normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  normalized = normalized.replace(/\/{2,}/g, "/");

  if (normalized === "/") return normalized;
  if (isHtmlDocumentPath(normalized)) return normalized;
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

export function validateSitePages(pages: readonly SitePageDefinition[]): void {
  const ids = new Set<string>();
  const paths = new Set<string>();

  for (const page of pages) {
    if (!page.id.trim()) throw new Error("Site page id must not be empty");
    if (ids.has(page.id)) throw new Error(`Duplicate site page id: ${page.id}`);
    ids.add(page.id);

    const normalizedPath = normalizePagePath(page.path);
    if (normalizedPath !== page.path) {
      throw new Error(`Site page path must be canonical: ${page.path} -> ${normalizedPath}`);
    }
    if (paths.has(page.path)) throw new Error(`Duplicate site page path: ${page.path}`);
    paths.add(page.path);

    if (page.discovery.indexable && !page.enabled) {
      throw new Error(`Disabled page must not be indexable: ${page.id}`);
    }
    if (page.discovery.indexable && !page.discovery.listed) {
      throw new Error(`Unlisted page must not be indexable: ${page.id}`);
    }

    switch (page.type) {
      case "case":
        if (!caseIds.has(page.entityId)) throw new Error(`Unknown Case page entity: ${page.entityId}`);
        break;
      case "project":
        if (!projectIds.has(page.entityId)) throw new Error(`Unknown Project page entity: ${page.entityId}`);
        break;
      case "collection":
        if (!collectionIds.has(page.entityId)) throw new Error(`Unknown Collection page entity: ${page.entityId}`);
        break;
      case "blog-post":
        if (page.id !== `blog:${page.slug}` || page.path !== `/blog/${page.slug}/`) {
          throw new Error(`Blog post page identity is inconsistent: ${page.id}`);
        }
        break;
      case "home":
      case "static":
      case "blog-index":
      case "not-found":
        break;
      default: {
        const exhaustive: never = page;
        throw new Error(`Unsupported site page: ${String(exhaustive)}`);
      }
    }
  }
}
