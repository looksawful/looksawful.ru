# Blog v1 Editorial Design

## Status

Approved architecture for the first production blog implementation on looksawful.ru.

The feature branch is intentionally based on the current head of `perf/tooling-pipeline-production` so the blog is developed against the media/build/E2E orchestration expected to land in `dev`. Before integration, re-check PR #24 and compare the feature branch with the then-current `dev`.

## Goal

Add a small, static, CMS-editable blog to looksawful.ru without changing the existing portfolio design system or loading the portfolio runtime on blog pages.

V1 routes:

- `/blog/`
- `/blog/<slug>/`

The blog supports tools, courses, tutorials and notes, long-form Russian text, code blocks, screenshots, tables, external resources and click-to-load YouTube video.

## Non-goals

Do not add Astro, Next.js, React routing, a database, a second CMS, a search service, pagination, comments, author profiles, tag routes, a floating table of contents, reading progress, share widgets or a second media pipeline.

Do not refactor the existing portfolio CSS, media presentation, captions, Jestei filter, project templates, Three.js components, media deck, lightbox, infinite reel, PageFlip or motion system.

## Existing architecture to preserve

The site is a Vite 8 static MPA. `src/site/pages/manifest.ts` owns architectural page definitions, Vite uses physical HTML inputs, renderers produce final HTML, `src/site/shell/page-shell.ts` owns the document shell, and Pages CMS edits selected content while routes and architecture remain code-owned.

Existing CSS foundation is already aligned with the desired modern CSS approach:

- cascade layers;
- global design tokens;
- semantic colors;
- logical properties;
- fluid `clamp()` scales;
- intrinsic `.wrapper`, `.stack`, `.prose`, `.grid`, `.split`, `.editorial-grid`, `.reel` patterns;
- container queries and container units in component CSS;
- `text-wrap: balance/pretty`;
- native nesting and low-specificity modern selectors.

These foundations are consumed by the blog and are not redesigned for it.

## Dependency direction

The invariant is:

```text
existing global design system
        ↓
      blog
```

Never:

```text
blog requirements
        ↓
global design system refactor
```

The following existing files must remain unchanged for the blog unless a separately demonstrated blocker requires an owner-approved exception:

- `src/styles/reset.css`
- `src/styles/tokens.css`
- `src/styles/colors.css`
- `src/styles/base.css`
- `src/styles/patterns.css`
- `src/styles/index.css`
- `src/styles/components.css`
- `src/styles/captions.css`
- `src/styles/motion.css`
- `src/main.js`

`src/styles/site-navigation.css` should also remain unchanged; blog pages may import it through their own CSS entry.

## Content model

All blog entries share one content type. Category is data, not architecture.

```ts
export const BLOG_KINDS = ["tool", "course", "tutorial", "note"] as const;
export type BlogKind = (typeof BLOG_KINDS)[number];

export interface BlogCover {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface BlogVideo {
  provider: "youtube";
  id: string;
  title: string;
}

export interface BlogEntry {
  slug: string;
  title: string;
  summary: string;
  kind: BlogKind;
  published: boolean;
  publishedAt: string;
  updatedAt?: string;
  featured?: boolean;
  tags: readonly string[];
  cover?: BlogCover;
  sourceName?: string;
  externalUrl?: string;
  video?: BlogVideo;
  body: string;
}
```

Source files live in `src/content/blog/*.md`. The filename is the slug source of truth. Frontmatter must not contain an independently editable slug.

Allowed slug pattern:

`^[a-z0-9]+(?:-[a-z0-9]+)*$`

## Validation

Build-time validation is the source of truth. CMS validation is convenience only.

Reject:

- invalid or duplicate slug;
- missing title/summary;
- unknown kind;
- non-boolean `published`;
- invalid publication/update dates;
- update date before publication date;
- invalid tags;
- non-http(s) external URL;
- cover path outside `/media/blog/`;
- invalid cover dimensions or empty alt;
- unknown video provider or invalid YouTube id;
- H1 inside Markdown body;
- malformed frontmatter.

Errors must identify subsystem, file and field, for example:

`[blog] src/content/blog/example.md: externalUrl must use http or https`

`published: false` means draft. Drafts are absent from the index, generated production inputs and sitemap.

## Markdown

Rendering occurs at build time. Use the smallest mature ESM-compatible packages that satisfy the contract. Raw HTML is disabled. V1 supports paragraphs, H2-H4, emphasis, links, lists, blockquotes, horizontal rules, inline code, fenced code and images. Tables may be enabled only with an explicit parser extension and tests.

The article title is the only H1.

## Routing and Vite inputs

`/blog/` is an architectural page and belongs in the static site page model.

Article routes are content-derived and must not be manually added to the static manifest one by one.

A deterministic `tools/prepare-blog-entries.mjs` creates Vite entry stubs at `blog/<slug>/index.html` for published entries. Generated files carry an ownership marker and cleanup removes only stale files with that marker. Repeated execution with unchanged content must be stable.

The build pipeline must prepare these entries before Vite discovers inputs. Integrate with the post-PR24 orchestration rather than creating a parallel media/build pipeline.

## Page model and renderers

Add explicit `blog-index` and `blog-post` page definitions. Blog pages are not disguised as project/case/collection pages.

Blog rendering lives in `src/site/renderers/blog/` with focused modules for index, post, cards, prose and video/resource markup.

## Shell asset profiles

Current page shell hard-codes portfolio assets. Extend it with an optional asset profile while preserving exact default behavior for every existing page.

Portfolio default:

- `/src/styles/index.css`
- `/src/main.js`

Blog:

- `/src/styles/blog-entry.css`
- `/src/blog.ts`

Blog pages must not load the portfolio runtime.

## Browser runtime

`src/blog.ts` is intentionally small. It may compose only the runtime relevant to blog pages:

- global site navigation;
- existing site analytics;
- blog filtering/search;
- click-to-load blog video;
- existing code-copy behavior.

Do not import GSAP, Three, PhotoSwipe, Embla, portfolio motion, media deck, lightbox, infinite reel, PageFlip, audio, canvas gallery, caption numbering or project-only runtime.

Every initializer that registers listeners returns a cleanup function. Page teardown follows the existing `pagehide` lifecycle.

## Filter and search

Without JavaScript, every published card is visible and usable.

Renderer emits:

- `data-blog-card`
- `data-blog-kind`
- `data-blog-search`

Search text is derived from title, summary, tags, kind and optional source name, not full article body.

Client state:

```ts
interface BlogFilterState {
  readonly kind: BlogKind | "all";
  readonly query: string;
}
```

Normalize query with NFKC, trim and Russian locale lowercase. Visibility uses native `hidden`. URL parameters are `type` and `q`; typing uses `replaceState`, category changes may use `pushState`, and `popstate` restores state.

## Video

V1 allows only structured YouTube data. No arbitrary iframe URLs from Markdown or CMS.

Before activation, render a normal figure/trigger and an external fallback link. Only after user activation create an iframe using `youtube-nocookie.com`, a meaningful `title`, the required `allow` value and `allowfullscreen`.

## CMS

Use existing Pages CMS. Add a scoped blog image source rooted at `public/media/blog` and a YAML-frontmatter Markdown collection rooted at `src/content/blog`.

CMS may edit content fields and publication state. Routes, page types, canonical logic, JSON-LD, Vite inputs, CSS classes and arbitrary HTML remain code-owned.

Create is enabled. Rename is disabled. Initial delete is disabled; unpublishing is the normal removal workflow.

Navigation continues the current contract: route and stable id are code-owned; label is CMS-editable.

## CSS architecture

Blog CSS is a separate entry, not an import into `src/styles/index.css`.

Target files:

```text
src/styles/blog-entry.css
src/styles/blog/blog.css
src/styles/blog/prose.css
src/styles/blog/code.css
src/styles/blog/media.css
```

`blog-entry.css` imports the existing reset/tokens/colors/base/patterns/navigation/utilities and the blog editorial files in cascade layers.

Do not create a second global token set. Blog-specific values are local custom properties on `.blog-index` and `.blog-post`.

Reuse `.wrapper`, `.prose`, `.stack`, `.cluster`, `.editorial-grid` and other existing intrinsic patterns instead of duplicating them under blog-prefixed generic names.

## Kevin Powell 2026 CSS principles applied

The implementation should follow content-first/intrinsic CSS rather than device-first breakpoints:

1. Prefer Grid/Flex algorithms and intrinsic sizing.
2. Use existing local custom-property APIs to configure patterns.
3. Use logical properties.
4. Use `min()`, `max()`, `clamp()` for bounded fluid display sizing.
5. Use container queries when a component responds to space allocated to it.
6. Use viewport media queries when the condition is truly viewport/device capability based, such as hover/pointer/reduced motion.
7. Keep reading text comparatively stable; fluid scaling is primarily for display typography.
8. Prefer low-specificity `:where()`/`:is()` and declarative `:has()` when they simplify real state.
9. Do not make newly available/experimental features such as `@scope`, style queries or CSS `if()` a production dependency without a concrete need.
10. CSS owns visual adaptation; TypeScript owns state and behavior.

## Typography

The site remains Inter-first. Blog reading introduces one additional family: Source Serif 4 Variable with real roman and italic faces.

Roles:

- global navigation/UI/index/cards/meta/captions/tables/resource data: Inter Variable;
- article title/lead/body/H2/H3/blockquote: Source Serif 4 Variable;
- code: existing `--ff-mono` stack.

Do not set the whole `.blog` subtree to serif.

Local starting values:

- long-form body: about 18px, `line-height: 1.58`, tracking 0;
- text measure: about `68ch`, tuned with real Russian content;
- title: fluid serif display size using a bounded `clamp()`;
- H2/H3: serif with moderate weights, not heavy bold;
- captions/meta: existing small Inter scale.

Existing global `text-wrap: balance/pretty` remains in effect.

## Editorial layout

Blog index stays visually connected to the site: large Inter `блог`, thin rules, editorial feed, minimal text filters and a real search field. Avoid SaaS cards, badges, colorful pills, shadows, sticky filter panels and sidebars.

Article header uses existing `.wrapper` and `.editorial-grid`. On wide layouts meta, title and lead may occupy asymmetric columns. On narrow layouts it collapses naturally.

Article prose uses a content/wide Grid model:

- paragraphs/headings/lists use the reading track;
- code/images/video/tables may use a wider track;
- mobile naturally collapses both to available width.

Use Grid tracks rather than negative-margin or transform breakout hacks.

## Code blocks

Code is a first-class editorial component.

- code body uses existing mono stack;
- code UI uses Inter;
- light/minimal surface, thin rules, no VS Code-style dark card by default;
- no line numbers in V1;
- no mandatory syntax highlighting runtime;
- long lines use horizontal scrolling and are not force-wrapped;
- scrollbar remains discoverable;
- reuse existing `createCodeBlocks()` DOM contract when possible.

## Media and tables

Article figures use blog-specific markup, not portfolio `.media`/caption contracts. Screenshots are not cropped and may receive a thin semantic border when needed against the page background. Captions use Inter.

Blog V1 images live under `public/media/blog/`; do not create a competing responsive-media builder. Existing project media source-of-truth remains untouched.

Tables use semantic table markup and Inter. On narrow containers they scroll horizontally rather than converting to cards.

## SEO

Extend metadata only where necessary. Blog index receives standard title/description/canonical/Open Graph metadata. Article pages additionally support article type, publication/modified dates, cover image and `BlogPosting` JSON-LD generated from typed content.

CMS never edits raw JSON-LD.

Use the existing sitemap pipeline; published built/indexable pages should be discovered by it, while drafts remain absent.

## Accessibility and progressive enhancement

- one H1 per article;
- semantic article, figure, table and time elements;
- native buttons/search input and visible label;
- keyboard-operable controls;
- visible focus;
- minimum practical touch target around 44px;
- no color-only state;
- no noisy live-region updates on every search keystroke;
- all content remains readable without JavaScript.

Motion is minimal and guarded by `prefers-reduced-motion: no-preference` where relevant.

## Testing and verification

Use TDD for behavior. Required automated coverage includes:

- content parsing and validation;
- slug and draft behavior;
- dynamic route generation;
- deterministic/stale-safe entry preparation;
- index/post rendering;
- shell asset profile regression;
- navigation/breadcrumbs;
- metadata/sitemap behavior;
- filter URL state;
- video click-to-load;
- representative browser smoke.

Use the existing shared E2E runtime rather than launching a second preview/browser stack.

Before completion run the repository's current `npm run verify` and relevant Lighthouse checks. In this environment where local repository execution is unavailable, GitHub Actions results are the verification source; never claim a check passed without an observed successful run.

## Integration boundary

The blog branch must remain reviewable as a blog feature. Before final integration:

1. confirm PR #24 is merged or otherwise resolve its base intentionally;
2. compare feature branch against current `dev`;
3. ensure the effective blog diff excludes unrelated tooling history;
4. run full verification against the integration base;
5. only then open/retarget the blog PR to `dev`.
