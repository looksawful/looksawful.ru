import { readdir, readFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

import { parse as parseYaml } from "yaml";

import type { BlogEntry } from "./types.ts";
import { assertUniqueBlogSlugs, validateBlogEntry } from "./validation.ts";

export interface ParseBlogDocumentInput {
  readonly filePath: string;
  readonly source: string;
}

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/;

function fail(filePath: string, message: string): never {
  throw new Error(`[blog] ${filePath}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseBlogDocument({ filePath, source }: ParseBlogDocumentInput): BlogEntry {
  const match = source.match(FRONTMATTER_PATTERN);
  if (!match) fail(filePath, "document must start with YAML frontmatter delimited by ---");

  let frontmatter: unknown;
  try {
    frontmatter = parseYaml(match[1]);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(filePath, `invalid YAML frontmatter: ${detail}`);
  }

  if (!isRecord(frontmatter)) fail(filePath, "frontmatter must be an object");
  if (Object.prototype.hasOwnProperty.call(frontmatter, "slug")) {
    fail(filePath, "slug must not be authored in frontmatter; filename owns routing");
  }

  const slug = basename(filePath, extname(filePath));
  const body = match[2].trim();

  return validateBlogEntry({ filePath, slug, frontmatter, body });
}

export async function loadBlogEntries(
  directory = resolve(process.cwd(), "src/content/blog"),
): Promise<readonly BlogEntry[]> {
  let directoryEntries;
  try {
    directoryEntries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return Object.freeze([]);
    throw error;
  }

  const filenames = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));

  const entries = await Promise.all(
    filenames.map(async (filename) => {
      const filePath = join(directory, filename);
      return parseBlogDocument({ filePath, source: await readFile(filePath, "utf8") });
    }),
  );

  assertUniqueBlogSlugs(entries);
  return Object.freeze(entries);
}

export function getPublishedBlogEntries(entries: readonly BlogEntry[]): readonly BlogEntry[] {
  return Object.freeze(
    entries
      .filter((entry) => entry.published)
      .toSorted((left, right) => {
        const byDate = right.publishedAt.localeCompare(left.publishedAt);
        return byDate || left.slug.localeCompare(right.slug, "en");
      }),
  );
}
