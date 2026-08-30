# Blog authoring

This is the editorial manual for the first production blog implementation on `looksawful.ru`.

The blog is a static part of the existing Vite MPA. Pages CMS edits authored Markdown content on `dev`; routes, rendering, SEO, validation and publication remain code-owned.

## 1. Where blog content lives

Blog entries are stored in:

```text
src/content/blog/*.md
```

Blog images are stored in:

```text
public/media/blog/*.webp
```

Public image URLs therefore use:

```text
/media/blog/<filename>.webp
```

Do not put blog images into project media folders and do not put project assets into the blog media source.

## 2. Routes and slugs

Public routes are:

```text
/blog/
/blog/<slug>/
```

The filename owns the article slug. For example:

```text
src/content/blog/comfyui-nodes.md
```

becomes:

```text
/blog/comfyui-nodes/
```

The slug is not an editable frontmatter field.

Allowed slug format:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Use lowercase Latin letters, digits and single hyphens. Do not use spaces, underscores, Cyrillic or uppercase characters.

Pages CMS allows choosing the filename only when creating a new entry. Rename is disabled after creation because renaming changes the public URL.

## 3. Publication state

`published: false` means draft.

Drafts:

- do not appear on `/blog/`;
- do not receive a generated production Vite entry;
- are not emitted into the sitemap;
- are not public routes.

`published: true` means the entry is eligible for the public site.

Unpublishing is the normal safe removal workflow in V1. CMS delete is intentionally disabled.

## 4. Entry types

Every entry uses one shared content model with one of four kinds:

```text
tool
course
tutorial
note
```

User-facing meanings:

- `tool` — useful software, service, library or workflow tool;
- `course` — a course or educational program;
- `tutorial` — a lesson or practical walkthrough;
- `note` — a shorter editorial note that does not fit the other categories.

Do not create separate folders or route systems for these categories. Category is data, not architecture.

## 5. Required fields

Every entry requires:

- `title`;
- `summary`;
- `kind`;
- `published`;
- `publishedAt`;
- Markdown `body`.

The build rejects malformed or incomplete entries.

### title

The public article title. It becomes the page H1.

Do not add another H1 inside the Markdown body.

### summary

A short description used on the blog index and as page metadata.

Keep it useful as a standalone explanation of what the entry contains.

### publishedAt

Publication date in ISO form:

```text
YYYY-MM-DD
```

### updatedAt

Optional update date in the same form.

If present, it must not be earlier than `publishedAt`.

### featured

Optional editorial flag. It is reserved for lightweight emphasis and must not be used to create a second routing or content system.

### tags

Optional list of search/filter vocabulary. Tags do not create public tag routes in V1.

## 6. Optional resource fields

### sourceName

Human-readable source/resource name, for example the product, course or publisher name.

### externalUrl

Optional external resource link.

Only `http://` and `https://` URLs are accepted by the content validator.

Do not paste JavaScript URLs, data URLs or arbitrary embed markup.

## 7. Cover images

A cover is optional. When used, it contains:

- `src`;
- `alt`;
- `width`;
- `height`.

The image must be a WebP inside `/media/blog/`.

Example:

```yaml
cover:
  src: /media/blog/comfyui-nodes.webp
  alt: Интерфейс ComfyUI с графом нод для генерации изображения
  width: 1600
  height: 1000
```

`width` and `height` are the real pixel dimensions of the selected WebP.

Alt text must describe the meaningful visual content. Do not use filenames as alt text and do not leave meaningful images without alt text.

Do not commit PSD, PSB, TIFF, source video or arbitrary large source files into `public/media/blog`.

V1 intentionally does not introduce a second responsive-image generator for blog images. The existing project media pipeline remains separate.

## 8. YouTube video

V1 accepts structured YouTube data only:

```yaml
video:
  provider: youtube
  id: dQw4w9WgXcQ
  title: Название видео для iframe
```

The ID must be a valid 11-character YouTube video ID.

Do not paste iframe HTML or a full arbitrary embed URL into Markdown.

The public page initially renders a normal trigger and external fallback link. The `youtube-nocookie.com` iframe is created only after explicit user activation.

## 9. Markdown rules

The article title is generated from frontmatter and is the only H1.

Inside body Markdown use:

- H2-H4 headings;
- paragraphs;
- emphasis;
- links;
- ordered and unordered lists;
- blockquotes;
- horizontal rules;
- inline code;
- fenced code blocks;
- blog images.

Raw HTML is intentionally rejected.

Do not put `<iframe>`, `<script>`, custom HTML components or copied embed snippets into Markdown.

### Headings

Allowed body hierarchy starts at H2:

```md
## Раздел

### Подраздел

#### Деталь
```

Do not write:

```md
# Второй H1
```

### Links

Normal `http`, `https`, `mailto`, fragment and safe relative links are supported.

Unsafe URL schemes fail the build rather than being silently accepted.

### Images in Markdown

Markdown body images must also use WebP under `/media/blog/` and require non-empty alt text.

Example:

```md
![Граф нод в ComfyUI](/media/blog/comfyui-graph.webp)
```

### Code blocks

Use normal fenced Markdown:

````md
```css
.example {
  display: grid;
}
```
````

The renderer converts fenced code to the site's existing code-copy DOM contract. Do not hand-author copy buttons or code-block HTML.

V1 does not require a client-side syntax-highlighting library.

## 10. Pages CMS workflow

Normal authoring happens on `dev`.

1. Open the repository in Pages CMS.
2. Confirm that the selected branch is `dev`.
3. Open `Блог`.
4. Create or edit an entry.
5. When creating a new entry, choose the permanent filename/slug carefully.
6. Fill required fields.
7. Upload/select WebP media only through the scoped blog media source.
8. Keep `published` disabled while the entry is incomplete.
9. Save.
10. Run site verification.
11. Set `published: true` only when the entry is ready for public routing/indexing.
12. Save and verify again.
13. Use the normal `dev -> prod` publication flow.

Do not edit blog files directly on `prod` through Pages CMS.

## 11. What CMS does not own

Pages CMS does not own:

- route implementation;
- slug after creation;
- canonical URLs;
- sitemap logic;
- JSON-LD;
- Open Graph implementation;
- CSS classes or layout;
- TypeScript runtime;
- Vite inputs;
- generated entry stubs;
- arbitrary HTML;
- arbitrary iframe URLs.

If one of those needs to change, treat it as a code change rather than an editorial save.

## 12. Local development and build behavior

`npm run dev` prepares content-derived blog entry stubs before Vite starts.

Normal site builds prepare blog entry stubs before the raw Vite build through `build:site`.

`build:vite` intentionally remains a low-level debugging command and stays equivalent to:

```text
vite build
```

Generated article entry stubs are ignored by Git and are reproducible from published Markdown content.

The entry generator deletes only stale files that carry its ownership marker. It must not remove arbitrary hand-authored directories under `/blog/`.

## 13. Validation failures

Blog build/validation errors are prefixed with:

```text
[blog]
```

Typical causes:

- invalid filename slug;
- duplicate slug;
- malformed YAML frontmatter;
- missing required title/summary/date;
- unknown kind;
- `updatedAt` before `publishedAt`;
- invalid external URL;
- cover outside `/media/blog/`;
- wrong or missing image dimensions/alt;
- invalid YouTube provider or ID;
- H1 in the Markdown body;
- raw HTML in Markdown;
- unsafe Markdown link;
- Markdown image outside `/media/blog/`.

Treat validation failures as content/schema errors to correct. Do not weaken the validator to make one malformed post pass.

## 14. Verification before publication

A blog change is not ready to publish until the repository verification contract is green.

The full verification includes, among other existing site checks:

- TypeScript;
- content/unit/integration tests;
- generated entry routing tests;
- site build/postbuild;
- metadata and sitemap checks;
- local link checks;
- browser smoke for `/blog/`;
- filter/search URL behavior;
- click-to-load YouTube runtime;
- unknown/draft route absence;
- existing portfolio/CV smoke suites.

Do not promote a failing `dev` state to `prod`.

## 15. Publication checklist

```text
[ ] Pages CMS branch is dev
[ ] filename/slug is final
[ ] kind is correct
[ ] title and summary are complete
[ ] publication/update dates are correct
[ ] images are WebP under /media/blog/
[ ] alt text is meaningful
[ ] image width/height match the actual file
[ ] YouTube ID/title are correct when video is used
[ ] body contains no H1 or raw HTML
[ ] draft verified before publication when appropriate
[ ] published=true only when ready
[ ] full verification green
[ ] dev -> prod PR reviewed
[ ] production deployment green
[ ] final production smoke check complete
```

## Editorial presentation contract

Presentation remains code-owned; authors choose structured content, not layout classes.

- `featured: true` is an editorial signal, but only the first featured published entry receives the promoted feed layout.
- A cover is optional. Text-only tools/notes are intentional and do not require placeholder media.
- If an entry has both `cover` and `video`, the cover becomes the click-to-load video poster; the article does not render a second standalone hero cover.
- Article H1 and all interface/meta text use the site's Inter system. Long-form lead/body headings/quotes use Source Serif 4.
- Markdown figures, fenced code and GFM tables may use the article wide track; normal prose stays on the reading measure.
- Tables retain semantic markup and horizontally scroll when their intrinsic width exceeds the viewport.
- Blog media must be a canonical `.webp` path under `/media/blog/`; traversal-like or encoded escape paths fail the build.
