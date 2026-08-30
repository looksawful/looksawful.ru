import type { BlogEntry } from "./types.ts";
import type { BlogPostPageDefinition } from "../pages/types.ts";
import { normalizePagePath, validateSitePages } from "../pages/validation.ts";

export function createBlogPostPageDefinition(entry: BlogEntry): BlogPostPageDefinition {
  return Object.freeze({
    id: `blog:${entry.slug}`,
    type: "blog-post",
    slug: entry.slug,
    title: entry.title,
    path: `/blog/${entry.slug}/`,
    enabled: entry.published,
    discovery: Object.freeze({ listed: entry.published, indexable: entry.published }),
  });
}

export function createBlogPageDefinitions(entries: readonly BlogEntry[]): readonly BlogPostPageDefinition[] {
  const pages = entries.filter((entry) => entry.published).map(createBlogPostPageDefinition);
  validateSitePages(pages);
  return Object.freeze(pages);
}

export function getBlogPostPageByPath(
  entries: readonly BlogEntry[],
  path: string,
): BlogPostPageDefinition | undefined {
  const normalized = normalizePagePath(path);
  return createBlogPageDefinitions(entries).find((page) => page.path === normalized);
}
