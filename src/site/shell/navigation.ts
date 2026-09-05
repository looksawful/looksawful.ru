import { escapeHtml } from "../../utils/html.ts";
import {
  getBreadcrumbItems,
  getPrimaryNavigationItems,
} from "../navigation/model.ts";
import type { SitePageDefinition } from "../pages/types.ts";

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

function renderAwfulface(): string {
  return `<svg class="site-nav__toggle-face" data-awfulface viewBox="0 0 512 512" aria-hidden="true" focusable="false">
        <circle class="awfulface__background" cx="256" cy="256" r="248" />
        <g fill="none" stroke="currentColor" stroke-width="25" stroke-linecap="round" stroke-linejoin="round">
          <ellipse data-awfulface-eye-left cx="100" cy="216" rx="20" ry="14" fill="currentColor" stroke="none" />
          <ellipse data-awfulface-eye-right cx="347" cy="171" rx="20" ry="14" fill="currentColor" stroke="none" />
          <path data-awfulface-accent-top d="M204 160 L358 56" />
          <path data-awfulface-accent-bottom d="M204 426 L302 482" />
          <path data-awfulface-face-upper d="M64 104 Q190 112 204 148 Q218 238 218 224 Q218 280 260 258 Q316 210 277 238" />
          <path data-awfulface-face-lower d="M106 392 Q176 314 218 372 Q232 434 302 336 Q336 328 372 372 Q428 356 414 367" />
          <g class="awfulface__morph-targets" aria-hidden="true">
            <path data-awfulface-target="desktop-upper" d="M142 142 L370 370" />
            <path data-awfulface-target="desktop-lower" d="M370 142 L142 370" />
            <path data-awfulface-target="coarse-upper" d="M104 104 L408 408" />
            <path data-awfulface-target="coarse-lower" d="M408 104 L104 408" />
            <path data-awfulface-target="collapse-upper" d="M252 252 L260 260" />
            <path data-awfulface-target="collapse-lower" d="M260 252 L252 260" />
          </g>
        </g>
      </svg>`;
}

function renderMenu(page: SitePageDefinition): string {
  const items = getPrimaryNavigationItems();
  const links = items
    .map((item) => {
      const current = item.id === page.id ? ' aria-current="page"' : "";
      return `<li class="site-nav__menu-item"><a class="site-nav__menu-link" href="${escapeHtml(item.href)}" data-preview="${escapeHtml(item.previewSrc)}"${current}>${escapeHtml(item.label)}</a></li>`;
    })
    .join("\n        ");

  return `<div class="site-nav__menu" id="site-menu" data-site-menu hidden>
    <nav class="site-nav__menu-nav" aria-label="Навигация по сайту">
      <ul class="site-nav__menu-list">
        ${links}
      </ul>
    </nav>
  </div>
  <figure class="menu-preview" data-menu-preview aria-hidden="true" hidden>
    <img class="menu-preview__image" data-menu-preview-image alt="" decoding="async" />
  </figure>`;
}

export function renderSiteNavigation(page: SitePageDefinition): string {
  return `<header class="site-nav" data-site-navigation>
  <div class="site-nav__bar">
    ${renderBreadcrumbs(page)}
    <button class="site-nav__toggle" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="site-menu" data-site-menu-toggle>
      ${renderAwfulface()}
    </button>
  </div>
  ${renderMenu(page)}
</header>`;
}
