import type { SitePageDefinition } from "../pages/types.ts";

export function renderSiteNavigation(page: SitePageDefinition): string {
  const current = page.type === "home" ? ' aria-current="page"' : "";
  return `<nav class="site-nav wrapper cluster" aria-label="Основная навигация" data-site-navigation>
  <a class="site-nav__brand" href="/">looksawful</a>
  <ul class="site-nav__list cluster">
    <li><a class="site-nav__link" href="/"${current}>Work</a></li>
  </ul>
</nav>`;
}
