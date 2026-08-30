import { SITE_ORIGIN } from "../../config.ts";
import { createBlogPostPageDefinition } from "../../blog/page-registry.ts";
import { renderBlogMarkdown } from "../../blog/markdown.ts";
import type { BlogEntry } from "../../blog/types.ts";
import { renderPageShell } from "../../shell/page-shell.ts";
import { escapeHtml } from "../../../utils/html.ts";
import { BLOG_PAGE_ASSETS } from "./assets.ts";
import { getBlogKindLabel } from "./blog-card.ts";
import { renderBlogVideo } from "./blog-video.ts";

function renderCover(entry: BlogEntry): string {
  if (!entry.cover) return "";
  return `<figure class="blog-post__cover wrapper"><img src="${escapeHtml(entry.cover.src)}" alt="${escapeHtml(entry.cover.alt)}" width="${entry.cover.width}" height="${entry.cover.height}" decoding="async"></figure>`;
}

function renderResource(entry: BlogEntry): string {
  if (!entry.externalUrl) return "";
  return `<aside class="blog-resource" aria-label="Ссылка на ресурс"><div class="blog-resource__row"><span class="blog-resource__label">ресурс</span><span class="blog-resource__value">${escapeHtml(entry.sourceName ?? entry.title)}</span></div><div class="blog-resource__row"><span class="blog-resource__label">ссылка</span><a class="blog-resource__value" href="${escapeHtml(entry.externalUrl)}" target="_blank" rel="noopener noreferrer">открыть официальный сайт ↗</a></div></aside>`;
}

export function renderBlogPostPage(entry: BlogEntry): string {
  const page = createBlogPostPageDefinition(entry);
  const tags = entry.tags.length ? `<p class="blog-post__tags">${entry.tags.map(escapeHtml).join(" / ")}</p>` : "";
  const updated = entry.updatedAt && entry.updatedAt !== entry.publishedAt
    ? `<span>обновлено <time datetime="${entry.updatedAt}">${entry.updatedAt}</time></span>`
    : "";
  const video = entry.video ? renderBlogVideo(entry.video) : "";
  const prose = renderBlogMarkdown(entry.body);
  const content = `<article class="blog-post">
  <header class="blog-post__header wrapper editorial-grid">
    <p class="blog-post__meta"><span>${getBlogKindLabel(entry)}</span><time datetime="${entry.publishedAt}">${entry.publishedAt}</time>${updated}</p>
    <h1 class="blog-post__title">${escapeHtml(entry.title)}</h1>
    <p class="blog-post__lead">${escapeHtml(entry.summary)}</p>
    ${tags}
  </header>
  ${renderCover(entry)}
  ${video ? `<div class="blog-post__feature wrapper">${video}</div>` : ""}
  <div class="blog-post__body"><div class="blog-prose prose">${renderResource(entry)}${prose}</div></div>
  <footer class="blog-post__footer wrapper"><a href="/blog/">← вернуться в блог</a></footer>
</article>`;

  const canonical = `${SITE_ORIGIN}${page.path}`;
  const structuredData: Readonly<Record<string, unknown>> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: entry.title,
    description: entry.summary,
    datePublished: entry.publishedAt,
    dateModified: entry.updatedAt ?? entry.publishedAt,
    mainEntityOfPage: canonical,
    url: canonical,
    author: { "@type": "Person", name: "Иван Крушинский" },
    keywords: entry.tags.join(", "),
    ...(entry.cover ? { image: `${SITE_ORIGIN}${entry.cover.src}` } : {}),
  };

  return renderPageShell({
    page,
    title: `${entry.title} — Иван Крушинский`,
    description: entry.summary,
    content,
    assets: BLOG_PAGE_ASSETS,
    metadata: {
      ogType: "article",
      image: entry.cover?.src,
      publishedAt: entry.publishedAt,
      modifiedAt: entry.updatedAt ?? entry.publishedAt,
      structuredData,
    },
  });
}
