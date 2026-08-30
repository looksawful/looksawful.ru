import type { BlogEntry } from "../../blog/types.ts";
import { escapeHtml } from "../../../utils/html.ts";

const KIND_LABELS = {
  tool: "инструмент",
  course: "курс",
  tutorial: "урок",
  note: "заметка",
} as const;

export interface RenderBlogCardOptions {
  readonly featured?: boolean;
}

export function getBlogKindLabel(entry: BlogEntry): string {
  return KIND_LABELS[entry.kind];
}

export function renderBlogCard(entry: BlogEntry, options: RenderBlogCardOptions = {}): string {
  const searchText = [entry.title, entry.summary, entry.kind, entry.sourceName ?? "", ...entry.tags].join(" ");
  const media = entry.cover
    ? `<figure class="blog-card__media"><img src="${escapeHtml(entry.cover.src)}" alt="${escapeHtml(entry.cover.alt)}" width="${entry.cover.width}" height="${entry.cover.height}" loading="lazy" decoding="async"></figure>`
    : "";
  const tags = entry.tags.length
    ? `<p class="blog-card__tags">${entry.tags.map(escapeHtml).join(" / ")}</p>`
    : "";
  const classes = [
    "blog-card",
    entry.cover ? "blog-card--media" : "blog-card--text",
    options.featured ? "blog-card--featured" : "",
  ].filter(Boolean).join(" ");

  return `<a class="${classes}" href="/blog/${escapeHtml(entry.slug)}/" data-blog-card data-blog-kind="${entry.kind}" data-blog-search="${escapeHtml(searchText)}">
  <p class="blog-card__meta"><span class="blog-card__kind">${getBlogKindLabel(entry)}</span><time datetime="${entry.publishedAt}">${entry.publishedAt}</time></p>
  <div class="blog-card__content"><h2 class="blog-card__title">${escapeHtml(entry.title)}</h2><p class="blog-card__summary">${escapeHtml(entry.summary)}</p>${tags}</div>
  ${media}
</a>`;
}
