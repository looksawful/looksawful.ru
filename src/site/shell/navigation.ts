import type { SitePageDefinition } from "../pages/types.ts";
import { escapeHtml } from "../../utils/html.ts";
import {
  getBreadcrumbItems,
  getPrimaryNavigationItems,
} from "../navigation/model.ts";

function renderBreadcrumbs(page: SitePageDefinition): string {
  const items = getBreadcrumbItems(page);
  if (!items.length) return '<span class="site-nav__context" aria-hidden="true"></span>';

  const content = items
    .map((item) => {
      const label = escapeHtml(item.label);
      if (item.current) {
        return `<span class="site-nav__breadcrumb-current" aria-current="page">${label}</span>`;
      }
      return `<a class="site-nav__breadcrumb-link" href="${escapeHtml(item.href ?? "/")}">${label}</a>`;
    })
    .join('<span class="site-nav__breadcrumb-separator" aria-hidden="true">/</span>');

  return `<nav class="site-nav__breadcrumbs" aria-label="Хлебные крошки">${content}</nav>`;
}

function renderMenu(page: SitePageDefinition): string {
  const items = getPrimaryNavigationItems();
  const links = items
    .map((item) => {
      const current = item.id === page.id ? ' aria-current="page"' : "";
      return `<li class="site-nav__menu-item"><a class="site-nav__menu-link" href="${escapeHtml(item.href)}"${current}>${escapeHtml(item.label)}</a></li>`;
    })
    .join("\n        ");

  return `<div class="site-nav__menu" id="site-menu" data-site-menu hidden>
    <nav class="site-nav__menu-nav" aria-label="Навигация по сайту">
      <ul class="site-nav__menu-list">
        ${links}
      </ul>
    </nav>
  </div>`;
}

export function renderSiteNavigation(page: SitePageDefinition): string {
  return `<header class="site-nav" data-site-navigation>
  <div class="site-nav__bar">
    <a class="site-nav__brand" href="/">looksawful</a>
    ${renderBreadcrumbs(page)}
    <button class="site-nav__toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="site-menu" data-site-menu-toggle>
      <span class="site-nav__toggle-icon" aria-hidden="true"><span></span><span></span></span>
    </button>
  </div>
  ${renderMenu(page)}
</header>`;
}
