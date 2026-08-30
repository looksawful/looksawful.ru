import {
  BLOG_KINDS,
  type BlogCover,
  type BlogEntry,
  type BlogEntryValidationInput,
  type BlogKind,
  type BlogVideo,
} from "./types.ts";
import { isBlogMediaWebpPath } from "./media-path.ts";

const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const blogKinds = new Set<string>(BLOG_KINDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(filePath: string, field: string, message: string): never {
  throw new Error(`[blog] ${filePath}: ${field} ${message}`);
}

function requiredString(value: unknown, filePath: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(filePath, field, "must be a non-empty string");
  }
  return value.trim();
}

function optionalString(value: unknown, filePath: string, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return requiredString(value, filePath, field);
}

function parseDate(value: unknown, filePath: string, field: string): string {
  const date = requiredString(value, filePath, field);
  if (!ISO_DATE_PATTERN.test(date)) fail(filePath, field, "must use YYYY-MM-DD");

  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    fail(filePath, field, "must be a valid calendar date");
  }
  return date;
}

function parseTags(value: unknown, filePath: string): readonly string[] {
  if (!Array.isArray(value)) fail(filePath, "tags", "must be an array of strings");

  const tags = value.map((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      fail(filePath, `tags[${index}]`, "must be a non-empty string");
    }
    return item.trim();
  });

  if (new Set(tags).size !== tags.length) fail(filePath, "tags", "must not contain duplicates");
  return Object.freeze(tags);
}

function parseExternalUrl(value: unknown, filePath: string): string | undefined {
  const externalUrl = optionalString(value, filePath, "externalUrl");
  if (!externalUrl) return undefined;

  let url: URL;
  try {
    url = new URL(externalUrl);
  } catch {
    fail(filePath, "externalUrl", "must be a valid http or https URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail(filePath, "externalUrl", "must use http or https");
  }

  return url.href;
}

function parseCover(value: unknown, filePath: string): BlogCover | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) fail(filePath, "cover", "must be an object");

  const src = requiredString(value.src, filePath, "cover.src");
  if (!isBlogMediaWebpPath(src)) {
    fail(filePath, "cover.src", "must reference a WebP under /media/blog/");
  }

  const alt = requiredString(value.alt, filePath, "cover.alt");
  const width = value.width;
  const height = value.height;

  if (!Number.isInteger(width) || Number(width) <= 0) {
    fail(filePath, "cover.width", "must be a positive integer");
  }
  if (!Number.isInteger(height) || Number(height) <= 0) {
    fail(filePath, "cover.height", "must be a positive integer");
  }

  return Object.freeze({ src, alt, width: Number(width), height: Number(height) });
}

function parseVideo(value: unknown, filePath: string): BlogVideo | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) fail(filePath, "video", "must be an object");

  if (value.provider !== "youtube") fail(filePath, "video.provider", "must be youtube");

  const id = requiredString(value.id, filePath, "video.id");
  if (!YOUTUBE_ID_PATTERN.test(id)) fail(filePath, "video.id", "must be a valid YouTube video id");

  const title = requiredString(value.title, filePath, "video.title");
  return Object.freeze({ provider: "youtube", id, title });
}

function containsMarkdownH1(body: string): boolean {
  let fence: "```" | "~~~" | null = null;

  for (const line of body.split(/\r?\n/)) {
    const trimmedStart = line.trimStart();
    const fenceMatch = trimmedStart.match(/^(```|~~~)/);
    if (fenceMatch) {
      const marker = fenceMatch[1] as "```" | "~~~";
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }

    if (fence === null && /^#(?:\s|$)/.test(trimmedStart)) return true;
  }

  return false;
}

export function validateBlogEntry(input: BlogEntryValidationInput): BlogEntry {
  const { filePath, slug, frontmatter, body } = input;

  if (!BLOG_SLUG_PATTERN.test(slug)) {
    fail(filePath, "slug", `must match ${BLOG_SLUG_PATTERN.source}`);
  }
  if (!isRecord(frontmatter)) fail(filePath, "frontmatter", "must be an object");
  if (typeof body !== "string" || body.trim().length === 0) {
    fail(filePath, "body", "must contain Markdown content");
  }
  if (containsMarkdownH1(body)) fail(filePath, "body", "must not contain an H1 heading");

  const title = requiredString(frontmatter.title, filePath, "title");
  const summary = requiredString(frontmatter.summary, filePath, "summary");
  if (typeof frontmatter.kind !== "string" || !blogKinds.has(frontmatter.kind)) {
    fail(filePath, "kind", `must be one of ${BLOG_KINDS.join(", ")}`);
  }
  const kind = frontmatter.kind as BlogKind;

  if (typeof frontmatter.published !== "boolean") {
    fail(filePath, "published", "must be a boolean");
  }
  const published = frontmatter.published;
  const publishedAt = parseDate(frontmatter.publishedAt, filePath, "publishedAt");
  const updatedAtValue = optionalString(frontmatter.updatedAt, filePath, "updatedAt");
  const updatedAt = updatedAtValue
    ? parseDate(updatedAtValue, filePath, "updatedAt")
    : undefined;

  if (updatedAt && updatedAt < publishedAt) {
    fail(filePath, "updatedAt", "must not be earlier than publishedAt");
  }

  if (frontmatter.featured !== undefined && typeof frontmatter.featured !== "boolean") {
    fail(filePath, "featured", "must be a boolean when provided");
  }

  const featured = frontmatter.featured as boolean | undefined;
  const tags = parseTags(frontmatter.tags, filePath);
  const sourceName = optionalString(frontmatter.sourceName, filePath, "sourceName");
  const externalUrl = parseExternalUrl(frontmatter.externalUrl, filePath);
  const cover = parseCover(frontmatter.cover, filePath);
  const video = parseVideo(frontmatter.video, filePath);

  return Object.freeze({
    slug,
    title,
    summary,
    kind,
    published,
    publishedAt,
    ...(updatedAt ? { updatedAt } : {}),
    ...(featured !== undefined ? { featured } : {}),
    tags,
    ...(cover ? { cover } : {}),
    ...(sourceName ? { sourceName } : {}),
    ...(externalUrl ? { externalUrl } : {}),
    ...(video ? { video } : {}),
    body,
  });
}

export function assertUniqueBlogSlugs(entries: readonly BlogEntry[]): void {
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.slug)) throw new Error(`[blog] duplicate slug: ${entry.slug}`);
    seen.add(entry.slug);
  }
}
