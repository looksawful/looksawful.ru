import type { BlogEntry } from "../../blog/types.ts";
import type { BlogIndexPageDefinition } from "../../pages/types.ts";
import { renderPageShell } from "../../shell/page-shell.ts";
import { renderBlogCard } from "./blog-card.ts";
import { BLOG_PAGE_ASSETS } from "./assets.ts";

const FILTERS = [
  ["all", "все"],
  ["tool", "инструменты"],
  ["course", "курсы"],
  ["tutorial", "уроки"],
  ["note", "заметки"],
] as const;

function orderFeedEntries(entries: readonly BlogEntry[]): readonly BlogEntry[] {
  const featured = entries.find((entry) => entry.featured);
  if (!featured) return entries;
  return [featured, ...entries.filter((entry) => entry.slug !== featured.slug)];
}

export function renderBlogIndexPage(
  page: BlogIndexPageDefinition,
  entries: readonly BlogEntry[],
): string {
  const feedEntries = orderFeedEntries(entries);
  const featuredSlug = feedEntries.find((entry) => entry.featured)?.slug;
  const cards = feedEntries
    .map((entry) => `<li>${renderBlogCard(entry, { featured: entry.slug === featuredSlug })}</li>`)
    .join("\n");
  const initialEmpty = entries.length === 0
    ? '<p class="blog-index__initial-empty wrapper">Пока здесь нет опубликованных материалов.</p>'
    : "";
  const controls = FILTERS.map(([kind, label], index) => (
    `<button class="blog-filter__button" type="button" data-blog-filter-kind="${kind}" aria-pressed="${index === 0 ? "true" : "false"}">${label}</button>`
  )).join("");

  const content = `<section class="blog-index" data-blog-index>
  <header class="blog-index__header wrapper editorial-grid">
    <h1 class="blog-index__title">блог</h1>
    <p class="blog-index__intro">Инструменты, курсы, видеоуроки и заметки о дизайне, коде и нейросетях.</p>
  </header>
  <div class="blog-index__controls wrapper" data-blog-filter>
    <div class="blog-filter__types" role="group" aria-label="Тип материала">${controls}</div>
    <div class="blog-search"><label class="blog-search__label" for="blog-search">поиск</label><input class="blog-search__input" id="blog-search" type="search" autocomplete="off" data-blog-search-input></div>
    <p class="blog-filter__count" data-blog-count>${entries.length}</p>
  </div>
  ${initialEmpty}
  <ol class="blog-feed wrapper">${cards}</ol>
  <p class="blog-index__empty wrapper" data-blog-empty hidden>Ничего не найдено.</p>
</section>`;

  return renderPageShell({
    page,
    title: "Блог — Иван Крушинский",
    description: "Инструменты, курсы, видеоуроки и заметки о дизайне, коде и нейросетях.",
    content,
    assets: BLOG_PAGE_ASSETS,
  });
}
