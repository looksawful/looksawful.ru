import assert from "node:assert/strict";
import test from "node:test";

async function loadValidationModule() {
  try {
    return await import("../src/site/blog/validation.ts");
  } catch (error) {
    assert.fail(`Blog validation module is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const makeValidInput = (overrides = {}) => ({
  filePath: "src/content/blog/comfyui-impact-pack.md",
  slug: "comfyui-impact-pack",
  frontmatter: {
    title: "ComfyUI Impact Pack",
    summary: "Короткое описание инструмента.",
    kind: "tool",
    published: true,
    publishedAt: "2026-08-30",
    updatedAt: "2026-08-30",
    featured: false,
    tags: ["comfyui", "ai"],
    sourceName: "Impact Pack",
    externalUrl: "https://example.com/impact-pack",
    cover: {
      src: "/media/blog/comfyui-impact-pack.webp",
      alt: "Интерфейс ComfyUI",
      width: 1600,
      height: 1000,
    },
    video: {
      provider: "youtube",
      id: "dQw4w9WgXcQ",
      title: "ComfyUI tutorial",
    },
  },
  body: "## Зачем нужен инструмент\n\nОсновной текст статьи.",
  ...overrides,
});

test("validateBlogEntry returns a normalized typed entry for valid authored data", async () => {
  const { validateBlogEntry } = await loadValidationModule();
  assert.equal(typeof validateBlogEntry, "function");

  const entry = validateBlogEntry(makeValidInput());

  assert.equal(entry.slug, "comfyui-impact-pack");
  assert.equal(entry.kind, "tool");
  assert.equal(entry.published, true);
  assert.deepEqual(entry.tags, ["comfyui", "ai"]);
  assert.equal(entry.video?.provider, "youtube");
});

test("validateBlogEntry rejects invalid filename-derived slugs with file context", async () => {
  const { validateBlogEntry } = await loadValidationModule();

  assert.throws(
    () => validateBlogEntry(makeValidInput({ slug: "ComfyUI Impact Pack" })),
    /\[blog\].*comfyui-impact-pack\.md.*slug/i,
  );
});

test("validateBlogEntry rejects non-http external URLs", async () => {
  const { validateBlogEntry } = await loadValidationModule();
  const input = makeValidInput({
    frontmatter: {
      ...makeValidInput().frontmatter,
      externalUrl: "javascript:alert(1)",
    },
  });

  assert.throws(
    () => validateBlogEntry(input),
    /\[blog\].*externalUrl.*http/i,
  );
});

test("validateBlogEntry rejects a second H1 inside Markdown body", async () => {
  const { validateBlogEntry } = await loadValidationModule();

  assert.throws(
    () => validateBlogEntry(makeValidInput({ body: "# Второй H1\n\nТекст." })),
    /\[blog\].*body.*h1/i,
  );
});

test("assertUniqueBlogSlugs rejects duplicate routes", async () => {
  const { assertUniqueBlogSlugs, validateBlogEntry } = await loadValidationModule();
  assert.equal(typeof assertUniqueBlogSlugs, "function");

  const first = validateBlogEntry(makeValidInput());
  const second = validateBlogEntry(
    makeValidInput({ filePath: "src/content/blog/duplicate.md" }),
  );

  assert.throws(
    () => assertUniqueBlogSlugs([first, second]),
    /\[blog\].*duplicate.*comfyui-impact-pack/i,
  );
});
